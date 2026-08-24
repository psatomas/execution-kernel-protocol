# Module competition at scale: benchmark findings

Every real run of this protocol prior to this benchmark — the Foundry unit
tests, the SDK quickstart, the full Playwright E2E flow — exercised
`ExecutionEngine._selectBestModule` with exactly two registered candidates
(`RouterModule`, `MevProtectionModule`). `ModuleRegistry`'s per-intent-type
module list has no upper bound. This document measures what actually happens,
correctness and gas both, as that count grows, and what that implies for the
architecture. It does not change any production contract — see
`test/ModuleScalability.t.sol` (new tests) and
`test/mocks/MockConfigurableModule.sol` (new mock) for the measurement code
itself. Reproduce with:

```bash
forge test --match-contract ModuleScalabilityTest -vv
```

All numbers below are from a real run of that suite (Foundry 1.7.1, Solc
0.8.35), not estimated.

## 1. Candidate count scaling (happy path)

All candidates valid, supported, and distinctly scored (so the winner is
unambiguous at every N). Gas is for the full `executeIntent()` call.

| candidates | `executeIntent()` gas | marginal gas / added candidate |
|---:|---:|---:|
| 1   | 45,522    | — |
| 2   | 60,969    | 15,447 |
| 5   | 107,326   | 15,452 |
| 10  | 184,636   | 15,462 |
| 20  | 339,445   | 15,481 |
| 50  | 805,354   | 15,530 |
| 100 | 1,586,823 | 15,629 |

The relationship is linear to a very close approximation (marginal cost
drifts from 15,447 to 15,629 gas across a 100x growth in N — about a 1.2%
increase). The drift is consistent with Solidity's memory-expansion cost,
which is quadratic in total memory words; at these scales it is a rounding
error, not yet a real effect. Linear fit: roughly **30,000 gas base +
~15,600 gas per evaluated candidate**.

`ModuleRegistry.getModules()` alone (the O(n) storage-array copy plus its
two-pass active-count/active-fill loop) accounts for a small, near-constant
slice of that per-candidate cost:

| candidates | `getModules()` gas alone | share of `executeIntent()` marginal cost |
|---:|---:|---:|
| 1   | 4,565   | — |
| 100 | 192,480 | ~1,898 gas/candidate (~12%) |

The remaining ~88% of the per-candidate cost is the three external calls
`_selectBestModule` makes per candidate (`supportsIntent`, `simulate`,
`scorePolicy.evaluateQuoteBytes`), not the registry read.

**Registration** (`ModuleRegistry.registerModule`) is cheap and effectively
flat regardless of how many modules already exist — measured at
**51,075 gas** to register the 100th module onto a list of 99, in the same
range as registering the 2nd. This is expected: a dynamic-array `push` plus
one mapping write don't touch the existing entries. The registry's *write*
side scales fine; all of the scaling risk below is on the *read/evaluate*
side.

## 2. Adversarial mixes (n=20 total candidates)

| scenario | `executeIntent()` gas | outcome |
|---|---:|---|
| 20 valid candidates (baseline) | 339,445 | correct winner |
| 1 valid + 19 reverting in `simulate()` | 159,377 | correct winner, all 19 skipped |
| 1 valid + 19 unsupported (`supportsIntent` = false) | 111,174 | correct winner, all 19 skipped |
| 10 malformed-quote + 10 valid | 271,321 | correct winner among the 10 valid |
| 20 broken (mixed revert reasons) | reverts | clean `"No compatible modules"`, confirmed at n=20 (previously only tested at n=3) |
| 5 candidates, identical score | — | first-registered wins, confirmed deterministic |
| same 20-candidate set, called twice | — | identical winner both times |

Three things worth noting:

- **Failure has a cost hierarchy.** Unsupported (111,174) is cheapest — it
  short-circuits at `supportsIntent()` and never reaches `simulate()` or
  `evaluateQuoteBytes()`. A `simulate()` revert (159,377) costs more because
  one more external call is attempted before failing. Both are cheaper than
  a fully successful candidate, because a successful path also pays for a
  real return value, its ABI decode inside `ScorePolicy`, and the comparison
  logic.
- **No failure behavior changed with scale.** The try/catch skip logic in
  `_selectBestModule` held at every N tested, including a full n=20 all-broken
  set — one broken candidate blocking the whole intent type (the bug this
  repo already found and fixed once) does not reappear at any larger N.
- **Ties resolve deterministically**, and repeated calls against the same
  registered set always return the same winner — selection has no hidden
  nondeterminism at any scale tested.

## What this means for the architecture

Sections 1 and 2 above are **measured**: real numbers from a real
`forge test` run, reproducible with the command at the top of this
document. Everything below this point is either an **extrapolation** from
that measured data (labeled as such) or an **architectural conclusion**
drawn from it (labeled as such) — neither is itself a new measurement.

**Extrapolated — not measured, not a guarantee.** Projecting the measured
linear fit (~30,000 gas base + ~15,600 gas/candidate) forward, an
illustrative ~30,000,000 gas budget (a rough L1-scale block gas limit, not a
number this project has picked for any real target chain) would not be
exhausted by `executeIntent()` alone until roughly **1,900 registered
candidates**. This number was never actually run — the suite only measured
up to n=100 — and it is not a safe or guaranteed ceiling:

- It assumes the measured slope holds unchanged all the way to n=1,900. The
  marginal cost already drifted upward by ~1.2% from n=1 to n=100 (Solidity's
  memory-expansion cost is quadratic in total memory words); at 19x the
  largest n actually tested, that drift could be materially larger and the
  true ceiling correspondingly lower than 1,900.
- It uses **near-zero-cost mock modules**. A real module's `simulate()` does
  real work — price lookups, external calls into other protocols, oracle
  reads — that this benchmark's mocks (a handful of immutable reads) do not
  represent at all. If a real module's `simulate()` costs, say, 10x this
  benchmark's ~15,600 gas/candidate floor, the actual candidate count before
  exhausting the same gas budget would be roughly 10x lower, not 1,900.

The only claim this extrapolation actually supports is a narrow one: **gas
exhaustion is not, by itself, a reason to impose a candidate cap at any
module count this protocol has discussed** (single digits to a few dozen).
It is not evidence that 1,900 candidates would work in practice.

**Architectural conclusion.** `executeIntent()` is called and paid for by
the end user, not a subsidized relayer, and the loop evaluates every
registered candidate unconditionally — there is no way to skip modules
on-chain that a caller already knows they don't care about. Going from 2 to
20 registered modules (a modest, plausible near-term number if module
competition becomes a real marketplace) is a **~5.6x gas increase per
execution**, measured, for the exact same outcome a well-chosen single
module would have produced directly — and, per the caveat above, real
modules would very likely widen that gap further, not close it. This is a
user-experience and cost problem long before it is a gas-limit problem.

Registration is owner-gated today (`registerModule` is `onlyOwner`), which
is the only thing currently preventing this from being a griefing vector —
nobody can spam a long tail of junk candidates onto the list to tax every
future caller's gas. The long-term product thesis in this repo's brief
(third-party wallets/DeFi apps/AI agents integrating as B2B applications)
points toward opening module registration up eventually. That must not
happen until its economic/security implications are explicitly designed:
each additional registered candidate increases the execution cost borne by
users, so permissionless registration without a mitigation (a registration
bond/stake, an explicit per-intent-type candidate cap, a permissioned
allowlist tier, or off-chain pre-filtering the engine trusts) would let any
third party tax every other user's transactions for free.

**The selection architecture is sound at the tested scale. The current
owner-gated registration model is acceptable for the present stage. Future
permissionless module registration requires an explicit economic/security
design because each registered candidate increases the execution cost
borne by users.** This benchmark deliberately implements no cap, bond, fee,
or governance change — per the brief, this phase measures the existing
architecture; it does not optimize or monetize it. Whether and how to bound
candidate count is a product decision this data can now inform, not one
this data forces or this change makes.
