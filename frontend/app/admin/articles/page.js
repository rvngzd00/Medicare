import ResourceManager from "../../../components/admin/ResourceManager";

export const metadata = { title: "Məqalələr" };

export default function AdminArticlesPage() {
  return <ResourceManager resource="articles" />;
}
