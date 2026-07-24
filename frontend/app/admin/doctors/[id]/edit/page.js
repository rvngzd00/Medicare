import ResourceEditor from "../../../../../components/admin/ResourceEditor";

export const metadata = { title: "Həkimi redaktə et" };

export default async function EditDoctorPage({ params }) {
  const { id } = await params;
  return <ResourceEditor resource="doctors" mode="edit" id={id} />;
}
