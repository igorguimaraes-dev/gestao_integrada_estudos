import { Fornecedor } from '../types';

const prestadoresImportados: Fornecedor[] = [
  { id: 'forn_import_bruna_moraes', nome: 'Bruna Moraes', chavePix: '00013874932648', banco: '', ativo: false, status: 'inativo' },
  { id: 'forn_import_hazael_chaves', nome: 'Hazael Chaves', chavePix: '00054984080242', banco: '', ativo: false, status: 'inativo' },
  { id: 'forn_import_igor_guimaraes', nome: 'Igor Guimaraes', chavePix: '46395114000189', tipoChavePix: 'cnpj', banco: '', ativo: false, status: 'inativo' },
  { id: 'forn_import_jesse_nunes', nome: 'Jesse Nunes', chavePix: '00007474821958', banco: '', ativo: false, status: 'inativo' },
  { id: 'forn_import_lucas_macedo', nome: 'Lucas Macedo', chavePix: '00081989919038', banco: '', ativo: false, status: 'inativo' },
  { id: 'forn_import_marlon_carvalho', nome: 'Marlon Carvalho', chavePix: '00014636772784', tipoChavePix: 'cpf', banco: '', ativo: true, status: 'ativo', valorPadrao: 300000 },
  { id: 'forn_import_ralph_richter', nome: 'Ralph Richter', chavePix: '00011897523793', tipoChavePix: 'cpf', banco: '', ativo: true, status: 'ativo', valorPadrao: 300000 },
  { id: 'forn_import_victor_oliveira', nome: 'Victor Oliveira', chavePix: '57597540000111', tipoChavePix: 'cnpj', banco: '', ativo: false, status: 'inativo', valorPadrao: 185000 },
  { id: 'forn_import_helton_chaves', nome: 'Helton Chaves', chavePix: '58901632000106', tipoChavePix: 'cnpj', banco: '', ativo: true, status: 'ativo', valorPadrao: 100000 },
  { id: 'forn_import_tainara_mallet_seo', nome: 'Tainara Mallet (SEO)', chavePix: '45618769000106', tipoChavePix: 'cnpj', banco: '', ativo: false, status: 'inativo', valorPadrao: 32000 },
  { id: 'forn_import_melissa_alves', nome: 'Melissa Alves', chavePix: '00021973547354', tipoChavePix: 'cpf', banco: '', ativo: false, status: 'inativo', valorPadrao: 50000 },
  { id: 'forn_import_nathalia_almeida', nome: 'Nathalia Almeida', chavePix: '00015872215789', tipoChavePix: 'cpf', banco: '', ativo: false, status: 'inativo', valorPadrao: 160000 },
  { id: 'forn_import_mylena_wermelingef', nome: 'Mylena Wermelingef', chavePix: '00015872196709', tipoChavePix: 'cpf', banco: '', ativo: false, status: 'inativo', valorPadrao: 180000 },
  { id: 'forn_import_caio_cesar', nome: 'Caio Cesar', chavePix: '00006534479575', tipoChavePix: 'cpf', banco: '', ativo: true, status: 'ativo', valorPadrao: 50000 },
];

export function mesclarPrestadoresImportados(fornecedores: Fornecedor[]): Fornecedor[] {
  const chavesPixExistentes = new Set(fornecedores.map((fornecedor) => fornecedor.chavePix));
  return [
    ...fornecedores,
    ...prestadoresImportados.filter((fornecedor) => !chavesPixExistentes.has(fornecedor.chavePix)),
  ];
}
