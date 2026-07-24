import ResourceEditor from "../../../../components/admin/ResourceEditor";

export const metadata = { title: "Yeni istifadəçi" };

export default function NewUserPage() {
  return <ResourceEditor resource="users" />;
}
