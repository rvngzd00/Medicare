"use client";

import { useMemo, useState } from "react";
import DoctorCard from "@/components/doctors/DoctorCard";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";

export default function DoctorsDirectory({ doctors, initialDepartment = "" }) {
  const [filters, setFilters] = useState({
    query: "",
    department: initialDepartment,
    specialty: "",
    experience: "",
    branch: ""
  });

  const specialties = useMemo(() => [...new Set(doctors.map((item) => item.specialty))], [doctors]);
  const branches = useMemo(() => [...new Set(doctors.map((item) => item.branch))], [doctors]);
  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Map(
          doctors
            .filter((item) => item.department)
            .map((item) => [
              item.department,
              item.departmentName || item.department
            ])
        )
      ).map(([slug, name]) => ({ slug, name })),
    [doctors]
  );
  const results = useMemo(() => {
    const normalized = filters.query.trim().toLocaleLowerCase("az");
    return doctors.filter((doctor) => {
      const matchQuery = !normalized || `${doctor.name} ${doctor.specialty}`.toLocaleLowerCase("az").includes(normalized);
      const matchDepartment = !filters.department || doctor.department === filters.department;
      const matchSpecialty = !filters.specialty || doctor.specialty === filters.specialty;
      const matchBranch = !filters.branch || doctor.branch === filters.branch;
      const matchExperience =
        !filters.experience ||
        (filters.experience === "15" ? doctor.experience >= 15 : doctor.experience >= Number(filters.experience) && doctor.experience < Number(filters.experience) + 5);
      return matchQuery && matchDepartment && matchSpecialty && matchBranch && matchExperience;
    });
  }, [doctors, filters]);

  function update(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function reset() {
    setFilters({ query: "", department: "", specialty: "", experience: "", branch: "" });
  }

  return (
    <>
      <div className="directoryFilter">
        <div className="directoryFilter__search">
          <Icon name="search" size={19} />
          <input name="query" value={filters.query} onChange={update} placeholder="Həkim adı və ya ixtisas..." aria-label="Həkim axtar" />
        </div>
        <select name="department" value={filters.department} onChange={update} aria-label="Şöbəyə görə filter">
          <option value="">Bütün şöbələr</option>
          {departmentOptions.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
        </select>
        <select name="specialty" value={filters.specialty} onChange={update} aria-label="İxtisasa görə filter">
          <option value="">Bütün ixtisaslar</option>
          {specialties.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select name="experience" value={filters.experience} onChange={update} aria-label="Təcrübəyə görə filter">
          <option value="">İstənilən təcrübə</option>
          <option value="5">5–9 il</option>
          <option value="10">10–14 il</option>
          <option value="15">15+ il</option>
        </select>
        {branches.length > 1 && (
          <select name="branch" value={filters.branch} onChange={update} aria-label="Filiala görə filter">
            <option value="">Bütün ünvanlar</option>
            {branches.map((item) => <option key={item}>{item}</option>)}
          </select>
        )}
      </div>
      <div className="directoryResultBar">
        <p><strong>{results.length}</strong> mütəxəssis tapıldı</p>
        {Object.values(filters).some(Boolean) && <button type="button" onClick={reset}>Filterləri təmizlə <Icon name="close" size={15} /></button>}
      </div>
      {results.length ? (
        <div className="cardGrid cardGrid--four">
          {results.map((doctor) => <DoctorCard doctor={doctor} key={doctor.slug} />)}
        </div>
      ) : (
        <EmptyState title="Uyğun həkim tapılmadı" text="Axtarış sözünü və ya seçdiyiniz filterləri dəyişərək yenidən yoxlayın." action={<button className="button button--soft" type="button" onClick={reset}>Filterləri sıfırla</button>} />
      )}
    </>
  );
}
