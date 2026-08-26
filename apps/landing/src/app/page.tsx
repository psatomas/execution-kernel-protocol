import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ExecutionQuoteSection } from "@/components/sections/ExecutionQuoteSection";
import { ModularExecution } from "@/components/sections/ModularExecution";
import { B2BDeployments } from "@/components/sections/B2BDeployments";
import { DeveloperExperience } from "@/components/sections/DeveloperExperience";
import { Validation } from "@/components/sections/Validation";
import { SecurityPrinciples } from "@/components/sections/SecurityPrinciples";
import { RoadmapStatus } from "@/components/sections/RoadmapStatus";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <ExecutionQuoteSection />
        <ModularExecution />
        <B2BDeployments />
        <DeveloperExperience />
        <Validation />
        <SecurityPrinciples />
        <RoadmapStatus />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  );
}
