import { notFound } from "next/navigation";
import { ContentSectionEditor } from "../../../../components/admin/ContentManager";
import { contentEditorMeta } from "../../../../components/admin/adminData";

export async function generateMetadata({ params }) {
  const { section } = await params;
  return { title: contentEditorMeta[section]?.title || "Kontent redaktoru" };
}

export default async function ContentSectionPage({ params }) {
  const { section } = await params;
  if (!contentEditorMeta[section]) notFound();
  return <ContentSectionEditor section={section} />;
}
