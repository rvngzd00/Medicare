import ResourceEditor from "../../../../components/admin/ResourceEditor";

export const metadata = { title: "Yeni məqalə" };

export default function NewArticlePage() {
  return <ResourceEditor resource="articles" />;
}
