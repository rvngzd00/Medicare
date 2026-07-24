import ResourceEditor from "../../../../../components/admin/ResourceEditor";

export const metadata = { title: "İstifadəçini redaktə et" };

export default async function EditUserPage({ params }) {
  const { id } = await params;
  return <ResourceEditor resource="users" mode="edit" id={id} />;
}
