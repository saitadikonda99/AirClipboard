import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import WhyStrip from '@/components/WhyStrip';
import HowItWorks from '@/components/HowItWorks';
import PrivacySection from '@/components/PrivacySection';
import Download from '@/components/Download';
import Closing from '@/components/Closing';

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <WhyStrip />
      <HowItWorks />
      <PrivacySection />
      <Download />
      <Closing />
    </>
  );
}
