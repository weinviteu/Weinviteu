import PageBanner from "@/components/PageBanner";
import styles from "./templates.module.css";
import TemplatesCatalogueSkeleton from "./TemplatesCatalogueSkeleton";

export default function TemplatesLoading() {
  return (
    <main className={styles.templatesPage}>
      <PageBanner
        crumb="Templates"
        eyebrow="THE INVITATION COLLECTION"
        title="Find the one that"
        accent="feels like you."
        description="Romantic, playful, or rooted in tradition. Explore the collection and open a live preview to find your celebration’s perfect beginning."
        posters={[
          "/template-posters/wedding-golden-vows.webp",
          "/template-posters/birthday-golden-wish.webp",
          "/template-posters/baby-naming-little-star.webp",
          "/template-posters/traditional-sacred-beginnings.webp",
          "/template-posters/anniversary-still-us.webp",
        ]}
      />
      <TemplatesCatalogueSkeleton />
    </main>
  );
}

