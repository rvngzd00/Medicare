import Link from "next/link";
import Icon from "@/components/common/Icon";
import { getDepartment } from "@/data/departments";
import styles from "@/components/common/Cards.module.css";

export default function ServiceCard({ service, index = 0 }) {
  const department = getDepartment(service.department);
  return (
    <article className={styles.serviceCard}>
      <div className={styles.serviceTop}>
        <span className={styles.serviceIcon}><Icon name={service.icon} size={25} /></span>
        <span className={styles.serviceNumber}>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3><Link href={`/services/${service.slug}`}>{service.name}</Link></h3>
      <p>{service.summary}</p>
      <div className={styles.serviceMeta}>
        <span>{service.departmentName || department?.name || "Medicare"}</span>
      </div>
      <Link className={styles.textLink} href={`/services/${service.slug}`}>
        Ətraflı bax <Icon name="arrow" size={17} />
      </Link>
    </article>
  );
}
