export class HealthCheckService {
  constructor() {
    this.startTime = Date.now();
    this.lastHealthCheck = null;
    this.isWarmedUp = false;
  }

  async performLocalHealthCheck() {
    try {
      const now = Date.now();
      const uptime = now - this.startTime;
      
      // メモリ使用量をチェック
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      };
      
      // CPU使用率の簡易チェック（プロセスが応答可能かを確認）
      const startCpuCheck = process.hrtime.bigint();
      await new Promise(resolve => setTimeout(resolve, 10));
      const endCpuCheck = process.hrtime.bigint();
      const cpuResponseTime = Number(endCpuCheck - startCpuCheck) / 1000000; // ナノ秒からミリ秒
      
      const healthData = {
        status: 'healthy',
        uptime: uptime,
        memory: memUsageMB,
        cpuResponseTime: cpuResponseTime,
        timestamp: now,
        isWarmedUp: this.isWarmedUp
      };
      
      this.lastHealthCheck = healthData;
      console.log('Local health check completed:', {
        uptime: `${Math.round(uptime / 1000)}s`,
        memory: `${memUsageMB.heapUsed}MB`,
        responseTime: `${cpuResponseTime.toFixed(2)}ms`
      });
      
      return { success: true, data: healthData };
    } catch (error) {
      console.error('Local health check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async checkAndWarmup(maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Performing warmup check ${attempt}/${maxRetries}...`);
      
      const result = await this.performLocalHealthCheck();
      
      if (result.success) {
        this.isWarmedUp = true;
        console.log('Service is warmed up and ready');
        return true;
      }
      
      if (attempt < maxRetries) {
        const delay = 500 * attempt; // 短いディレイ
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.warn('Warmup failed after all attempts, but continuing...');
    return false;
  }

  getHealthStatus() {
    return this.lastHealthCheck;
  }
}