import AdminShell from "../../components/admin/AdminShell";

export const metadata = {
  title: {
    default: "İdarəetmə paneli | Medicare",
    template: "%s | Medicare Admin",
  },
  description: "Medicare xəstəxanasının təhlükəsiz kontent və əməliyyat idarəetmə paneli.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
