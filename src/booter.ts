import { declareRegister } from "aileen-core";
import { Config } from "./config";
import { ConfigBean, LoggerClientBean } from "./injector";
import { LoggerClientImpl } from "./drive";

/**
 * 声明启动器
 */
export const booter = declareRegister(async (app, next) => {
  // 插件未配置
  if (!app.has(ConfigBean.ID)) return await next();

  // 服务不启动
  const config = app.get<Config>(ConfigBean.ID);
  if (!config.enable) return await next();

  // 注册依赖
  app.bind(LoggerClientBean.ID).toFactory(() => new LoggerClientImpl(config));

  // 执行应用启动
  await next();
});
