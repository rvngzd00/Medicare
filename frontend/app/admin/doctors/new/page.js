import ResourceEditor from "../../../../components/admin/ResourceEditor";

export const metadata = { title: "Yeni həkim" };

export default function NewDoctorPage() {
  return <ResourceEditor resource="doctors" />;
}
