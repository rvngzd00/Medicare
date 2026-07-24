export default function SectionHeading({
  eyebrow,
  title,
  text,
  align = "left",
  as = "h2"
}) {
  const Heading = as;
  return (
    <div className={`sectionHeading sectionHeading--${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Heading>{title}</Heading>
      {text && <p>{text}</p>}
    </div>
  );
}
