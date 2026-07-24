import ResourceEditor from "../../../../../components/admin/ResourceEditor";

export const metadata = { title: "Xidməti redaktə et" };

export default async function EditServicePage({ params }) {
  const { id } = await params;
  return <ResourceEditor resource="services" mode="edit" id={id} />;
}
