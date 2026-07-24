import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import { getDepartment } from "@/data/departments";
import { CONTACT } from "@/constants/site";
import styles from "@/components/common/Cards.module.css";

export default function DoctorCard({ doctor, phoneHref = CONTACT.phoneHref }) {
  const department = getDepartment(doctor.department);

  return (
    <article className={styles.doctorCard}>
      <Link className={styles.doctorImage} href={`/doctors/${doctor.slug}`} tabIndex={-1} aria-hidden="true">
        <span className={styles.doctorStatus}>Əlaqə mərkəzi açıqdır</span>
        <SmartImage
          src={doctor.image}
          alt={`${doctor.name}, ${doctor.specialty}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          fallbackLabel={doctor.name.replace("Dr. ", "")}
        />
      </Link>
      <div className={styles.doctorContent}>
        <span className={styles.doctorDepartment}>{doctor.departmentName || department?.name || "Medicare"}</span>
        <h3><Link href={`/doctors/${doctor.slug}`}>{doctor.name}</Link></h3>
        <p className={styles.doctorSpecialty}>{doctor.specialty}</p>
        <div className={styles.doctorMeta}>
          <span><Icon name="shield" size={15} />{doctor.experience} il təcrübə</span>
          <span><Icon name="location" size={15} />{(doctor.branch || "Medicare").replace("Medicare ", "")}</span>
        </div>
        <p className={styles.doctorBio}>{doctor.bio}</p>
        <div className={styles.cardActions}>
          <Link className="button button--dark button--small" href={`/doctors/${doctor.slug}`}>
            Profilə bax
          </Link>
          <a
            className="button button--soft button--icon"
            href={phoneHref}
            aria-label={`${doctor.name} haqqında məlumat üçün zəng et`}
          >
            <Icon name="phone" size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
