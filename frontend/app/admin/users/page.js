import ResourceManager from "../../../components/admin/ResourceManager";

export const metadata = { title: "İstifadəçilər" };

export default function AdminUsersPage() {
  return <ResourceManager resource="users" />;
}
