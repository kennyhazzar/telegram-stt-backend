export class CommonConfigs {
  port: number;
  env: string;
  secret: string;
  pricePerMinute: number;
}

export class DatabaseConfigs {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export class RedisConfigs {
  host: string;
  port: number;
}

export class ThrottlerConfigs {
  ttl: number;
  limit: number;
}

export class StorageConfigs {
  domain: string;
  user: string;
  password: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export class BotConfigs {
  token: string;
  botUrl: string;
}

export class PaymentConfigs {
  accountId: number;
  secretKey: string;
  apiUrl: string;
}
