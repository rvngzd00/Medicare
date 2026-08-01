import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import styles from "@/components/common/Cards.module.css";

export default function LeadershipCard({ leader }) {
  const education = Array.isArray(leader.education) ? leader.education : [];
  const experience = Array.isArray(leader.experience) ? leader.experience : [];

  return (
    <article className={styles.leadershipCard}>
      <div className={styles.leadershipImage}>
        <SmartImage
          src={leader.image}
          alt={leader.imageAlt || `${leader.name}, ${leader.position}`}
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
          fallbackLabel={leader.name}
        />
      </div>
      <div className={styles.leadershipContent}>
        <span className={styles.leadershipPosition}>{leader.position}</span>
        <h3>{leader.name}</h3>
        <p className={styles.leadershipBio}>{leader.bio}</p>
        {(education.length > 0 || experience.length > 0) && (
          <div className={styles.leadershipDetails}>
            {education.length > 0 && (
              <div>
                <strong><Icon name="document" size={16} />Təhsil</strong>
                <ul>{education.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            {experience.length > 0 && (
              <div>
                <strong><Icon name="shield" size={16} />İş təcrübəsi</strong>
                <ul>{experience.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
