import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import styles from "@/components/common/Cards.module.css";

export default function DepartmentCard({ department, index = 0 }) {
  return (
    <article className={styles.departmentCard}>
      <Link className={styles.departmentImage} href={`/departments/${department.slug}`} tabIndex={-1}>
        <span className={styles.departmentIndex}>{String(index + 1).padStart(2, "0")}</span>
        <SmartImage
          src={department.image}
          alt={`${department.name} şöbəsi`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fallbackLabel={department.name}
        />
      </Link>
      <div className={styles.departmentContent}>
        <span className={styles.iconBox}><Icon name={department.icon} size={25} /></span>
        <h3><Link href={`/departments/${department.slug}`}>{department.name}</Link></h3>
        <p>{department.summary}</p>
        <Link className={styles.textLink} href={`/departments/${department.slug}`}>
          Şöbəni kəşf et <Icon name="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}
