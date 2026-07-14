export interface User { id: number; nrp: string; nama: string; pangkat: string | null }
export interface DashboardStats { total: number; perwira: number; bintara: number; tamtama: number }
export interface Personnel { id: number; nrp: string; nama: string; pangkat?: string | null; kategoriPangkat?: string | null; jabatan?: string | null; satuan?: string | null;[key: string]: unknown }
export interface PersonnelPage { items: Personnel[]; total: number; page: number; pageSize: number; totalPages: number }
export interface Report { id: number; jenis: string; periode?: string | null; status: string }
export interface Settings { id: number; namaSatgas?: string | null; namaKesatuan?: string | null; lokasi?: string | null; komandan?: string | null; nrpKomandan?: string | null }
