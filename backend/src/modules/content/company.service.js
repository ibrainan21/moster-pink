import CompanyRepository from "./company.repository.js";

class CompanyService {
  async get() {
    return CompanyRepository.get();
  }

  // "Upsert": si aún no existe información de la empresa, la crea;
  // si ya existe, la actualiza. Evita que el admin tenga que saber
  // si es la primera vez que configura estos datos.
  async save(data) {
    const existing = await CompanyRepository.get();
    if (!existing) return CompanyRepository.create(data);
    return CompanyRepository.update(existing.id, data);
  }
}

export default new CompanyService();
