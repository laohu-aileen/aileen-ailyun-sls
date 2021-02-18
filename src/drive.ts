import { SLS } from "aliyun-sdk";
import { Config } from "./config";
import {
  LogItem,
  LogOption,
  FinderOption,
  AliyunStorage,
  AliyunLoggerClient,
} from "./interface";

/**
 * 日志仓库
 */
export class StorageImpl<T extends LogItem = any> implements AliyunStorage<T> {
  protected client: any;
  protected name: string;
  protected project: string;

  constructor(client: any, project: string, name: string) {
    this.client = client;
    this.project = project;
    this.name = name;
  }

  /**
   * 批量提交日志
   * @param data
   * @param option
   */
  putLogs(data: T[], option: LogOption = {}): Promise<void> {
    const logs = data.map((item) => {
      const log: {
        time: number;
        contents: Array<{
          key: string;
          value: string;
        }>;
      } = {
        time: item.time,
        contents: [],
      };

      if (!item.time) {
        log.time = Math.floor(new Date().getTime() / 1000);
      }

      for (const key in item) {
        if (key === "time") continue;
        log.contents.push({
          key,
          value: item[key].toString(),
        });
      }

      return log;
    });

    return new Promise((resolve, reject) => {
      this.client.putLogs(
        {
          projectName: this.project,
          logStoreName: this.name,
          logGroup: {
            ...option,
            logs,
          },
        },
        (err: any) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * 推送日志
   * @param data
   * @param option
   */
  putLog(data: T, option: LogOption = {}): Promise<void> {
    return this.putLogs([data], option);
  }

  /**
   * 获取日志
   * @param from
   * @param to
   * @param option
   */
  async getLogs(
    from: Date | number,
    to: Date | number,
    option: FinderOption = {}
  ): Promise<T[]> {
    const res = await this.find(from, to, "", option);
    return res.map(({ __topic__, __source__, __time__, ...info }) => {
      const data: any = {};
      for (const name in info) {
        const match = /__(.*)__/.exec(name);
        if (!match) data[name] = info[name];
      }
      if (__topic__ && __topic__ !== "") {
        data.topic = __topic__;
      }
      if (__source__ && __source__ !== "") {
        data.source = __source__;
      }
      if (__time__) {
        data.time = Number(__time__);
      }
      return data;
    });
  }

  /**
   * 查询日志
   * @param from
   * @param to
   * @param option
   */
  find<S = any>(
    from: Date | number,
    to: Date | number,
    query: string,
    option: FinderOption = {}
  ): Promise<S[]> {
    // 时间处理
    if (from instanceof Date) {
      from = Math.floor(from.getTime() / 1000);
    }
    if (to instanceof Date) {
      to = Math.floor(to.getTime() / 1000);
    }

    // 查询选项
    const execOption: any = {
      ...option,
      from,
      to,
      projectName: this.project,
      logStoreName: this.name,
    };

    // 查询语句
    if (query && query !== "") {
      execOption.query = query;
    }

    // 执行查询
    return new Promise((resolve, reject) => {
      this.client.getLogs(execOption, (err: any, data: any) => {
        if (err) return reject(err);
        const res: any[] = [];
        for (const key in data.body) {
          res.push(data.body[key]);
        }
        resolve(res);
      });
    });
  }
}

/**
 * 日志服务
 */
export class LoggerClientImpl implements AliyunLoggerClient {
  protected client: any;

  /**
   * 构造方法
   * @param option
   */
  constructor(option: Config) {
    let region = option.region;
    if (option.internal) {
      region += "-intranet";
    }
    this.client = new SLS({
      accessKeyId: option.accessKeyId,
      secretAccessKey: option.accessKeySecret,
      endpoint: `http://${region}.sls.aliyuncs.com`,
      apiVersion: "2015-06-01",
    });
  }

  /**
   * 获取项目的仓库列表
   * @param name
   */
  listStorageFromProject(name: string): Promise<AliyunStorage[]> {
    return new Promise((resolve, reject) => {
      this.client.listLogStores(
        {
          projectName: name,
        },
        (err: any, { body }: any) => {
          if (err) return reject(err);
          const res = body.logstores.map(
            (storage: string) => new StorageImpl(this.client, name, storage)
          );
          resolve(res);
        }
      );
    });
  }

  /**
   * 获取仓库
   * @param project
   * @param name
   */
  getStorage<T = any>(project: string, name: string): AliyunStorage<T> {
    return new StorageImpl<T>(this.client, project, name);
  }
}
