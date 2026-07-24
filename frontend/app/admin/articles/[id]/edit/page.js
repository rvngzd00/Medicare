import ResourceEditor from "../../../../../components/admin/ResourceEditor";

export const metadata = { title: "Məqaləni redaktə et" };

export default async function EditArticlePage({ params }) {
  const { id } = await params;
  return <ResourceEditor resource="articles" mode="edit" id={id} />;
}
