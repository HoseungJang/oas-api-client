export interface SuccessShow {
  success: boolean;
}

export interface BookListShow {
  data: {
    name: string;
  }[];
  nextCursor: number | null;
}

export interface BookShow {
  name: string;
}

export interface GetBooksByCursorRequestParameter {
  cursor?: number;
}

export interface GetBooksByCursorResponse {
  data: {
    name: string;
  }[];
  nextCursor: number | null;
}

export interface CreateBookRequestParameter {
  name: string;
}

export interface CreateBookResponse {
  name: string;
}

export interface DeleteBookByIdRequestParameter {
  id: number;
}

export interface DeleteBookByIdResponse {
  success: boolean;
}
