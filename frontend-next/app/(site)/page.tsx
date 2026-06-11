import Hero from "@/components/home/Hero";
import AboutTPC from "@/components/home/AboutTPC";
import PlacementHighlights from "@/components/home/PlacementHighlights";
import PastRecruiters from "@/components/home/PastRecruiters";
import TrustedLeaders from "@/components/home/TrustedLeaders";
import HeadMessage from "@/components/home/HeadMessage";
import Announcements from "@/components/home/Announcements";
import PublicDownloads from "@/components/home/PublicDownloads";
import PortalAccess from "@/components/home/PortalAccess";
import ContactUs from "@/components/home/ContactUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutTPC />
      <PlacementHighlights />
      <PastRecruiters />
      <TrustedLeaders />
      <HeadMessage />
      <Announcements />
      <PublicDownloads />
      <PortalAccess />
      <ContactUs />
    </>
  );
}
