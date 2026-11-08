import { PICKER_SCOPE, clearAccessToken, requestAccessToken } from '../../../components/photos/pickerAuth';

type Callbacks = {
    callback: (resp: Record<string, unknown>) => void;
    error_callback: (err: { type: string; message?: string }) => void;
    scope: string;
};

function installGis(respond: (cfg: Callbacks) => void) {
    const requestAccessTokenFn = jest.fn();
    const initTokenClient = jest.fn((cfg: Callbacks) => ({
        requestAccessToken: () => { requestAccessTokenFn(); respond(cfg); }
    }));
    (window as any).google = { accounts: { oauth2: { initTokenClient } } };
    return { initTokenClient, requestAccessTokenFn };
}

describe('pickerAuth', () => {
    beforeEach(() => {
        clearAccessToken();
        delete (window as any).google;
    });

    test('requests only the picker scope and resolves the token', async () => {
        const gis = installGis((cfg) => cfg.callback({ access_token: 'abc', expires_in: 3600 }));

        expect(await requestAccessToken()).toBe('abc');
        expect(gis.initTokenClient.mock.calls[0][0].scope).toBe(PICKER_SCOPE);
    });

    test('reuses an unexpired token without prompting again', async () => {
        const gis = installGis((cfg) => cfg.callback({ access_token: 'abc', expires_in: 3600 }));

        await requestAccessToken();
        await requestAccessToken();

        expect(gis.requestAccessTokenFn).toHaveBeenCalledTimes(1);
    });

    test('asks again when the cached token is about to expire', async () => {
        const gis = installGis((cfg) => cfg.callback({ access_token: 'abc', expires_in: 30 }));

        await requestAccessToken();
        await requestAccessToken();

        expect(gis.requestAccessTokenFn).toHaveBeenCalledTimes(2);
    });

    test('rejects when Google returns an error', async () => {
        installGis((cfg) => cfg.callback({ error: 'access_denied' }));
        await expect(requestAccessToken()).rejects.toThrow('access_denied');
    });

    test('rejects when the consent popup is closed or blocked', async () => {
        installGis((cfg) => cfg.error_callback({ type: 'popup_closed' }));
        await expect(requestAccessToken()).rejects.toThrow('popup_closed');
    });
});
