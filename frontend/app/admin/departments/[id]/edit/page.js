import ResourceEditor from "../../../../../components/admin/ResourceEditor";

export const metadata = { title: "Şöbəni redaktə et" };

export default async function EditDepartmentPage({ params }) {
  const { id } = await params;
  return <ResourceEditor resource="departments" mode="edit" id={id} />;
}
