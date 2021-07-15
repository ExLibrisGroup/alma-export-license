export interface Collection {
  id: string;
  name: string;
  fullname: string;
  children?: Collection[];
}