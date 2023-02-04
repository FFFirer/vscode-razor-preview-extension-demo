# vscode-masa-blazor-preview

[vscode-masa-blazor-preview](https://gitee.com/fffirer/vscode-masa-blazor-preview) 为vscode插件项目。

[DynamicRenderRazorDemoInJs](https://gitee.com/fffirer/DynamicRenderRazorDemoInJs) 为后端服务项目

# 功能

1. 打开`*.razor`/`*.cshtml`文件时，点击右上角`预览Razor文件`，渲染整个文件。
2. 打开`*.razor`/`*.cshtml`文件时，选中一段代码，渲染右键选中部分。

# 开发

将两个项目克隆到本地，`vscode-masa-blazor-preview\vscode-masa-blazor-preview`和`DynamicRenderRazorDemoInJs\src\DynamicRazorRender.Server` 为主要代码。

## 还原

```shell
cd ./vscode-masa-blazor-preview/vscode-masa-blazor-preview

yarn
```

```shell
cd ./DynamicRenderRazorDemoInJs/src

dotnet restore
```

# 调试

均在`vscode`的环境下开发。

使用`vscode`打开目录`vscode-masa-blazor-preview\vscode-masa-blazor-preview`, 按`F5`键即可开始调试插件项目。 

后端服务监听地址设置为默认`http://localhost:5000`。

### 1. 使用外部的后端服务

注释`vscode-masa-blazor-preview\vscode-masa-blazor-preview\src\extension.ts`第34行代码。

```typescript
// sessionManagerV2.start();
```

单独启动后端项目或者启动调试。

```shell
# DynamicRenderRazorDemoInJs/src/DynamicRazorRender.Server

dotnet run --urls=http://localhost:5000
```

### 2. 由插件启动后端服务

`vscode-masa-blazor-preview\vscode-masa-blazor-preview\src\extension.ts`第34行代码去掉注释。

```typescript
sessionManagerV2.start();
```

将后端项目生成输出到插件项目`vscode-masa-blazor-preview\vscode-masa-blazor-preview\modules\RazorPreviewService\`目录下

```shell
# DynamicRenderRazorDemoInJs/src/DynamicRazorRender.Server

dotnet publish -c Release -o ..\..\..\vscode-masa-blazor-preview\vscode-masa-blazor-preview\modules\RazorPreviewService\
```
直接启动插件项目调试即可
