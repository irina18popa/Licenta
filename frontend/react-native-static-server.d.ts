declare module 'react-native-static-server' {
  export default class StaticServer {
    constructor(port: number, root: string, options?: { localOnly?: boolean });
    start(): Promise<string>;   // resolves to the local URL
    stop(): Promise<void>;
  }
}
