/*
Copyright 2025 API Testing Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Process HTTP response with proper content type handling
 * 
 * This function handles both JSON and non-JSON responses:
 * 1. For JSON responses, parses and returns the JSON object
 * 2. For non-JSON responses (like text/plain), returns the raw text
 * 
 * @param response The fetch API response object
 * @returns Parsed JSON object or raw text content
 */
async function DefaultResponseProcess(response: any): Promise<any> {
    if (!response.ok) {
        switch (response.status) {
            case 401:
                throw new Error("Unauthenticated");
            // Potentially add other specific status code handling here
        }

        // For non-OK responses, attempt to parse error details from the body
        let errorMessage = `Request failed with status ${response.status}`;
        const clonedResponseForErrorJson = response.clone();
        try {
            const errorData = await clonedResponseForErrorJson.json();
            errorMessage = errorData?.message || JSON.stringify(errorData);
        } catch (jsonError: any) {
            console.debug(
                `Error response body (status ${response.status}) was not valid JSON. Attempting to read as text. JSON parse error:`, 
                jsonError
            );
            // Body consumed by failed .json() attempt on clone, try .text() on a new clone of original response
            const clonedResponseForErrorText = response.clone();
            try {
                const textData = await clonedResponseForErrorText.text();
                if (textData) {
                    errorMessage = textData;
                } else {
                    errorMessage = `Request failed with status ${response.status} (empty error body).`;
                }
            } catch (textError: any) {
                console.debug(
                    `Error response body (status ${response.status}) also failed to be read as text. Text parse error:`, 
                    textError
                );
                // Fallback error message if body is entirely unreadable
                errorMessage = `Request failed with status ${response.status} and error body was unreadable.`;
            }
        }
        throw new Error(errorMessage);
    }
    
    // For OK responses, handle content based on Content-Type
    const contentType = response.headers.get('Content-Type') ?? '';
    if (isTextReadableExpectJSON(contentType)) {
        // For text/plain, directly return the text
        return await response.text();
    }
    
    // For all other types (or if Content-Type is missing/unexpected), try parsing as JSON first
    try {
        return await response.json();
    } catch (jsonParseError: any) {
        // This catch block is an intentional part of the content negotiation.
        // If the response, despite its Content-Type (or lack thereof), isn't valid JSON,
        // we fall back to treating it as plain text. The original error is logged for debugging.
        console.debug(
            `Response body was not valid JSON (Content-Type: '${contentType}'). Falling back to plain text. JSON parse error:`, 
            jsonParseError
        );
        // The body stream was already consumed by the failed response.json() attempt.
        // A clone of the original response is needed to read the body as text.
        const clonedResponseForTextFallback = response.clone();
        return await clonedResponseForTextFallback.text();
    }
}

const isTextReadableExpectJSON = (contentType: string): boolean => {
    // Check if the content type is text-based
    return contentType.startsWith('text/') || contentType === 'application/javascript';
}

function safeToggleFunc(toggle?: (e: boolean) => void) {
    if (!toggle) {
        return (e: boolean) => { }
    }
    return toggle
}

const GetMenus = (callback?: (v: any) => void) => {
    const requestOptions = {
        method: 'GET',
        headers: {
            'X-Store-Name': 'vault'
        },
    }
    fetch('/api/v1/extension/menus', requestOptions)
        .then(DefaultResponseProcess)
        .then(emptyOrDefault(callback))
}

const GetPageOfJS = (name: string, callback?: (v: CommonResult) => void) => {
    const requestOptions = {
        method: 'GET',
        headers: {
            'X-Store-Name': 'vault'
        },
    }
    fetch(`/api/v1/extension/pages/${name}/js`, requestOptions)
        .then(DefaultResponseProcess)
        .then(emptyOrDefault(callback))
}

const GetPageOfCSS = (name: string, callback?: (v: CommonResult) => void) => { 
    const requestOptions = {
        method: 'GET',
        headers: {
            'X-Store-Name': 'vault'
        },
    }
    fetch(`/api/v1/extension/pages/${name}/css`, requestOptions)
        .then(DefaultResponseProcess)
        .then(emptyOrDefault(callback))
}

interface CommonResult {
    message: string
    success: boolean
}

export interface TestCase {
    suiteName: string
    name: string
    request: any
}

export interface RunTestCaseRequest {
    suiteName: string
    name: string
    parameters: any
}

export interface BatchRunTestCaseRequest {
    count: number
    interval: string
    request: RunTestCaseRequest
}

function CreateOrUpdateStore(payload: any, create: boolean,
    callback: (d: any) => void, errHandle?: (e: any) => void | null,
    toggle?: (e: boolean) => void) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'X-Auth': getToken(),
            'X-Store-Name': 'vault'
        },
        body: JSON.stringify(payload)
    }

    let api = '/api/v1/stores'
    if (!create) {
        api = `/api/v1/stores/${payload.name}`
        requestOptions.method = "PUT"
    }

    safeToggleFunc(toggle)(true)
    fetch(api, requestOptions)
        .then(DefaultResponseProcess)
        .then(callback).catch(emptyOrDefault(errHandle)).finally(() => {
            safeToggleFunc(toggle)(false)
        })
}

export interface Secret {
    Name: string
    Value: string
}

function GetSecrets(callback: (d: any) => void, errHandle?: (e: any) => void | null) {
    const requestOptions = {
        headers: {
            'X-Auth': getToken(),
            'X-Store-Name': 'vault'
        },
    }
    fetch(`/api/v1/secrets`, requestOptions)
        .then(DefaultResponseProcess)
        .then(callback)
        .catch(emptyOrDefault(errHandle))
}

function DeleteSecret(name: string,
    callback: (d: any) => void, errHandle?: (e: any) => void | null) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            'X-Auth': getToken(),
            'X-Store-Name': 'vault'
        }
    }
    fetch(`/api/v1/secrets/${name}`, requestOptions)
        .then(DefaultResponseProcess)
        .then(callback)
        .catch(emptyOrDefault(errHandle))
}

function CreateOrUpdateSecret(payload: Secret, create: boolean,
    callback: (d: any) => void, errHandle?: (e: any) => void | null,
    toggle?: (e: boolean) => void) {
    const requestOptions = {
        method: 'POST',
        headers: {
            'X-Auth': getToken(),
            'X-Store-Name': 'vault'
        },
        body: JSON.stringify(payload)
    }

    let api = `/api/v1/secrets`
    if (!create) {
        api = `/api/v1/secrets/${payload.Name}`
        requestOptions.method = "PUT"
    }

    safeToggleFunc(toggle)(true)
    fetch(api, requestOptions)
        .then(DefaultResponseProcess)
        .then(callback).catch(emptyOrDefault(errHandle)).finally(() => {
            safeToggleFunc(toggle)(false)
        })
}

function getToken() {
    const token = sessionStorage.getItem('token')
    if (!token) {
        return ''
    }
    return token
}

function emptyOrDefault(fn: any) {
    if (fn) {
        return fn
    }
    return () => { }
}

export interface QueryObject {
    store: string
    sql: string
    key: string
    offset: number
    limit: number
}
const DataQueryAsync = (query: QueryObject, final?: () => void | undefined | null) => {
    const requestOptions = {
        method: 'POST',
        headers: {
            'X-Store-Name': query.store,
            'X-Database': query.key,
            'X-Offset': `${query.offset}`,
            'X-Limit': `${query.limit}`
        },
        body: JSON.stringify(query)
    }
    return fetch(`/api/v1/data/query`, requestOptions)
        .then(DefaultResponseProcess).finally(final)
}

var DataQuery = (store: string, kind: string, currentDatabase: string, query: string, callback: (d: any) => void, errHandler: (d: any) => void) => {
    const queryObj = {} as QueryObject
    switch (kind) {
        case 'atest-store-orm':
            queryObj['sql'] = query;
            queryObj['key'] = currentDatabase;
            break;
        case 'atest-store-iotdb':
            queryObj['sql'] = query;
            queryObj['key'] = currentDatabase;
            break;
        case 'atest-store-etcd':
            queryObj['key'] = query;
            break;
        case 'atest-store-redis':
            queryObj['key'] = query;
            break;
    }
    const requestOptions = {
        method: 'POST',
        headers: {
            'X-Store-Name': store,
            'X-Database': currentDatabase
        },
        body: JSON.stringify(queryObj)
    }
    fetch(`/api/v1/data/query`, requestOptions)
        .then(DefaultResponseProcess)
        .then(callback)
        .catch(errHandler)
}

const GetThemes = (callback: (d: any) => void | null) => {
    return fetch(`/api/v1/themes`, {})
        .then(DefaultResponseProcess).then(callback)
}

const GetTheme = (name: string, callback: (d: any) => void | null) => {
    return fetch(`/api/v1/themes/${name}`, {})
        .then(DefaultResponseProcess).then(callback)
}

const GetBinding = (name: string, callback: (d: any) => void | null) => {
    return fetch(`/api/v1/bindings/${name}`, {})
        .then(DefaultResponseProcess).then(callback)
}

export const API = {
    GetMenus, GetPageOfJS, GetPageOfCSS,
    CreateOrUpdateStore,
    GetSecrets, DeleteSecret, CreateOrUpdateSecret, DataQuery, DataQueryAsync,
    GetThemes, GetTheme, GetBinding
}
