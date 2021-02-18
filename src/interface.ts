/**
 * 日志选项
 */
export interface LogOption {
  topic?: string;
  source?: string;
}

/**
 * 查询选项
 */
export interface FinderOption {
  topic?: string;
  line?: number;
  offset?: number;
}

/**
 * 日志数据
 */
export interface LogItem {
  time?: number;
  topic?: string;
  source?: string;
  [key: string]: any;
}

/**
 * 日志仓库
 */
export interface AliyunStorage<T extends LogItem = any> {
  /**
   * 批量提交日志
   * @param data
   * @param option
   */
  putLogs(data: T[], option?: LogOption): Promise<void>;

  /**
   * 推送日志
   * @param data
   * @param option
   */
  putLog(data: T, option?: LogOption): Promise<void>;

  /**
   * 获取日志
   * @param from
   * @param to
   * @param option
   */
  getLogs(
    from: Date | number,
    to: Date | number,
    option: FinderOption
  ): Promise<T[]>;

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
    option: FinderOption
  ): Promise<S[]>;
}

/**
 * 日志服务
 */
export interface AliyunLoggerClient {
  /**
   * 获取项目的仓库列表
   * @param name
   */
  listStorageFromProject(name: string): Promise<AliyunStorage[]>;

  /**
   * 获取仓库
   * @param project
   * @param name
   */
  getStorage<T = any>(project: string, name: string): AliyunStorage<T>;
}
