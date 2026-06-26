const { defineConfig } = require('@vue/cli-service')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer') // 生成项目资源分析图
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = defineConfig({
  productionSourceMap: false, // 关闭源码映射｜打包时不会生出 .map文件，加快打包速度
  transpileDependencies: true,
  lintOnSave: false, // 关闭eslint校验
  // 部署应用包时的基本 URL
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  // 配置webpack方式一
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = "瞎猫管理系统";
      return args;
    })
    // 生产环境 开启gzip压缩
    if (process.env.NODE_ENV === 'production') {
      config.plugin('webpack-report').use(BundleAnalyzerPlugin, [{
        analyzerMode: 'static'
      }])
      //  new CompressionPlugin({
      //    ...config配置
      // })
    }
  },
  // 配置webpack方式二
  configureWebpack: config => {
    // 开发环境不配置
    if (process.env.NODE_ENV !== 'production') return
    // 生产环境才去配置
    return {
      plugins: [
        new CompressionPlugin({ //此插件不能使用太高的版本，否则报错：TypeError: Cannot read property 'tapPromise' of undefined
          // filename: "[path][base].gz", // 这种方式是默认的，多个文件压缩就有多个.gz文件，建议使用下方的写法
          filename: '[path][base].gz[query]', //  使得多个.gz文件合并成一个文件，这种方式压缩后的文件少，建议使用
          algorithm: 'gzip', // 官方默认压缩算法也是gzip
          test: /\.js$|\.css$|\.html$|\.ttf$|\.eot$|\.woff$/, // 使用正则给匹配到的文件做压缩，这里是给html、css、js以及字体（.ttf和.woff和.eot）做压缩
          threshold: 10240, //以字节为单位压缩超过此大小的文件，使用默认值10240吧
          minRatio: 0.8, // 最小压缩比率，官方默认0.8
          //是否删除原有静态资源文件，即只保留压缩后的.gz文件，建议这个置为false，还保留源文件。以防：
          // 假如出现访问.gz文件访问不到的时候，还可以访问源文件双重保障
          deleteOriginalAssets: false
        })
      ]
    }
  },
  // sass-loader 配置：静默 Element UI 主题 SCSS 的 deprecation 警告
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          silenceDeprecations: ['color-functions', 'global-builtin', 'import', 'function-units', 'slash-div', 'legacy-js-api'],
        },
      },
    },
  },
  // webpack-dev-server开启IP和域名访问权限
  devServer: {
    historyApiFallback: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: { '^/api': '' } // 将 /api/user 转为 /user 发送给后端
      }
    }
  }
})
