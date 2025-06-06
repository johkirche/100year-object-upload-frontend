// This file is auto-generated by @hey-api/openapi-ts

import type { GetFilesResponse, CreateFileResponse, GetFileResponse } from './types.gen';

const filesSchemaResponseTransformer = (data: any) => {
    if (data.created_on) {
        data.created_on = new Date(data.created_on);
    }
    if (data.uploaded_on) {
        data.uploaded_on = new Date(data.uploaded_on);
    }
    return data;
};

export const getFilesResponseTransformer = async (data: any): Promise<GetFilesResponse> => {
    if (data.data) {
        data.data = data.data.map((item: any) => {
            return filesSchemaResponseTransformer(item);
        });
    }
    return data;
};

export const createFileResponseTransformer = async (data: any): Promise<CreateFileResponse> => {
    if (data.data) {
        data.data = filesSchemaResponseTransformer(data.data);
    }
    return data;
};

export const getFileResponseTransformer = async (data: any): Promise<GetFileResponse> => {
    if (data.data) {
        data.data = filesSchemaResponseTransformer(data.data);
    }
    return data;
};