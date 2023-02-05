export const defaultSetting = {
    bundledServicePath: "../modules/RazorPreviewService",
    executableName: "DynamicRazorRender.Server.exe",
    startupUrl: "http://localhost:5000",
}

export class Setting {
    bundledServicePath?: string;
    executableName?: string;
    startUrl?: string

    static load(): Setting {
        const setting = new Setting();
        
        setting.bundledServicePath = defaultSetting.bundledServicePath;
        setting.executableName = defaultSetting.executableName;
        setting.startUrl = defaultSetting.startupUrl;

        return setting;
    }
}