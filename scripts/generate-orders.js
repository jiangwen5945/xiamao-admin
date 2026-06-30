/**
 * 生成测试订单数据（武林外传主题，覆盖近一个月）
 * 使用方式: node scripts/generate-orders.js
 *
 * 执行内容：
 *   1. 清空 orders / order_item / after_sales / logistics_shipment / logistics_return / stock_movement
 *   2. 为新商品(ID>=224)补 inventory 记录
 *   3. 生成 ~70 条订单，时间均匀分布在 2026-06-01 ~ 2026-06-30
 *   4. 同步库存 / 销量 / 库存变动记录
 */
const mysql = require('/Users/jiangwen/Desktop/server/node_modules/mysql2/promise');

const DB = { host: 'localhost', user: 'root', password: '', database: 'dev5' };

// ========== 数据源 ==========
const MEMBERS = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: ['展红绫','白翠萍','姬无命','诸葛孔方','恭长张','平谷一点红','上官云顿','追风','钱掌柜','钱夫人',
    '小青','郭巨侠','郭蔷薇','郭芙蓉母亲','展堂','姬无病','姬无力','公孙乌龙','断指轩辕','杨蕙兰',
    '杜子俊','杜子俊的娘','胡娇娥','莫小宝','邱小冬','朱先生','老画师','曹先生','佟伯达','佟石头',
    '韩娟','老何','金湘玉','南宫残花','小米','赛貂蝉','小翠','岳松涛','陆一鸣','周敦儒',
    '祝小芸','清风','洪大师','白眉','窦先生','江小道','侯三','吴守义','小安','雷老五',
    '扈十娘','慕容嫣','慕容子','范大娘','包大仁','殷十三','辛普森','柳星雨','柳月云','七舅老爷'][i],
}))

const ADDRESSES = [
  { mid:1, name:'展红绫', phone:'13800001010', addr:'陕西省汉中市七侠镇同福客栈' },
  { mid:1, name:'展红绫', phone:'13800001010', addr:'陕西省汉中市七侠镇六扇门办事处' },
  { mid:2, name:'白翠萍', phone:'13800001011', addr:'陕西省汉中市七侠镇同福客栈后院' },
  { mid:3, name:'姬无命', phone:'13800001012', addr:'陕西省汉中市七侠镇醉仙楼' },
  { mid:4, name:'诸葛孔方', phone:'13800001013', addr:'陕西省汉中市七侠镇诸葛府' },
  { mid:5, name:'恭长张', phone:'13800001014', addr:'陕西省汉中市七侠镇张家大宅' },
  { mid:6, name:'平谷一点红', phone:'13800001015', addr:'陕西省汉中市七侠镇红宅' },
  { mid:7, name:'上官云顿', phone:'13800001016', addr:'陕西省汉中市七侠镇云来客栈' },
  { mid:8, name:'追风', phone:'13800001017', addr:'陕西省汉中市七侠镇追风小筑' },
  { mid:9, name:'钱掌柜', phone:'13800001018', addr:'陕西省汉中市七侠镇钱记杂货铺' },
  { mid:9, name:'钱夫人', phone:'13800001019', addr:'陕西省汉中市七侠镇钱府' },
  { mid:12, name:'郭巨侠', phone:'13800001021', addr:'陕西省汉中市七侠镇郭府' },
  { mid:21, name:'杜子俊', phone:'13800001030', addr:'陕西省汉中市七侠镇杜府' },
  { mid:29, name:'佟伯达', phone:'13800001038', addr:'陕西省汉中市七侠镇同福客栈' },
  { mid:29, name:'佟伯达', phone:'13800001038', addr:'陕西省汉中市七侠镇佟府' },
  { mid:31, name:'韩娟', phone:'13800001040', addr:'陕西省汉中市七侠镇韩家别院' },
  { mid:36, name:'赛貂蝉', phone:'13800001045', addr:'陕西省汉中市七侠镇怡红院' },
  { mid:51, name:'扈十娘', phone:'13800001060', addr:'陕西省汉中市七侠镇十娘小筑' },
  { mid:55, name:'包大仁', phone:'13800001064', addr:'陕西省汉中市七侠镇包府' },
]

// ========== 工具函数 ==========
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = arr => arr[rand(0, arr.length - 1)]
const makeOrderNo = () => `${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const STATUS_RATIO = [
  { status: 0, ratio: 0.15 },  // 待付款
  { status: 1, ratio: 0.15 },  // 待发货
  { status: 2, ratio: 0.20 },  // 待收货
  { status: 3, ratio: 0.35 },  // 已完成
  { status: 4, ratio: 0.05 },  // 已取消
  { status: 5, ratio: 0.05 },  // 已退款
  { status: 6, ratio: 0.05 },  // 售后中
]

// ========== 主流程 ==========
;(async () => {
  const conn = await mysql.createConnection(DB)
  console.log('数据库连接成功')

  // ---- Step 1: 清空旧数据 ----
  console.log('清空旧数据...')
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0')
  await conn.execute('DELETE FROM stock_movement')
  await conn.execute('DELETE FROM logistics_return')
  await conn.execute('DELETE FROM logistics_shipment')
  await conn.execute('DELETE FROM after_sales')
  await conn.execute('DELETE FROM order_item')
  await conn.execute('DELETE FROM orders')
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1')
  console.log('清空完成')

  // ---- Step 2: 为新商品补库存 ----
  console.log('为新商品补库存...')
  const [products] = await conn.execute(
    'SELECT id, price, name, status FROM product WHERE id >= 224 ORDER BY id'
  )
  const [existingInv] = await conn.execute('SELECT product_id FROM inventory')
  const existingIds = new Set(existingInv.map(r => r.product_id))
  const newProducts = products.filter(p => !existingIds.has(p.id))

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  for (const p of newProducts) {
    await conn.execute(
      'INSERT INTO inventory (product_id, quantity, sales_count, created_at, updated_at) VALUES (?, 100, 0, ?, ?)',
      [p.id, now, now]
    )
  }
  console.log(`补库存完成：新增 ${newProducts.length} 条`)

  // ---- Step 3: 生成订单 ----
  const totalOrders = Math.round(STATUS_RATIO.reduce((s, r) => s + r.ratio, 0) * 70)
  const statusList = []
  for (const { status, ratio } of STATUS_RATIO) {
    const count = Math.max(1, Math.round(totalOrders * ratio))
    for (let i = 0; i < count; i++) statusList.push(status)
  }
  // 打乱
  statusList.sort(() => Math.random() - 0.5)

  const productPool = products.filter(p => p.status === 1) // 仅上架商品
  const monthStart = new Date('2026-06-01T00:00:00+08:00').getTime()
  const monthEnd = new Date('2026-06-30T23:59:59+08:00').getTime()

  let orderIndex = 0
  for (const status of statusList) {
    orderIndex++

    // 随机时间（顺序递增，使得后面的订单时间更晚）
    const timestamp = monthStart + Math.random() * (monthEnd - monthStart)
    const orderTime = new Date(timestamp)
    const createdAt = orderTime.toISOString().slice(0, 19).replace('T', ' ')

    // 选会员
    const member = pick(MEMBERS)
    const memberId = member.id

    // 选址（优先选该会员的地址，否则随机）
    const memberAddrs = ADDRESSES.filter(a => a.mid === memberId)
    const addr = pick(memberAddrs.length ? memberAddrs : ADDRESSES)

    // 选商品（1-3个）
    const itemCount = rand(1, 3)
    const selectedProducts = []
    const usedIds = new Set()
    for (let i = 0; i < itemCount; i++) {
      let p
      let attempts = 0
      do {
        p = pick(productPool)
        attempts++
      } while (usedIds.has(p.id) && attempts < 10)
      usedIds.add(p.id)
      selectedProducts.push(p)
    }

    // 计算金额
    let totalAmount = 0
    const items = selectedProducts.map(p => {
      const qty = rand(1, 3)
      const subtotal = parseFloat((p.price * qty).toFixed(2))
      totalAmount += subtotal
      return { productId: p.id, productName: p.name, price: p.price, quantity: qty, subtotal, productImage: '' }
    })
    totalAmount = parseFloat(totalAmount.toFixed(2))

    // 生成订单号
    const orderNo = `${Date.now() - orderIndex * 1000}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // 计算各个时间戳（根据状态）
    const addHours = (base, hours) => {
      const d = new Date(base.getTime() + hours * 3600000)
      return d.toISOString().slice(0, 19).replace('T', ' ')
    }

    let paymentTime = null
    let deliveryTime = null
    let receiveTime = null
    let cancelTime = null

    if (status >= 1) {
      paymentTime = addHours(orderTime, rand(1, 24))
    }
    if (status >= 2) {
      deliveryTime = addHours(new Date(paymentTime), rand(6, 48))
    }
    if (status >= 3) {
      receiveTime = addHours(new Date(deliveryTime), rand(12, 72))
    }
    // 已退款 status=5 — payment_time 设置，但后续不出现发货/收货
    if (status === 5) {
      deliveryTime = null
      receiveTime = null
    }

    // 插入订单
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (order_no, member_id, total_amount, actual_amount, status,
        payment_method, payment_time, delivery_time, receive_time,
        consignee, consignee_phone, shipping_address, remark,
        created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo, memberId, totalAmount, totalAmount, status,
        status >= 1 ? pick(['微信支付', '支付宝', '线下支付']) : null,
        paymentTime, deliveryTime, receiveTime,
        addr.name, addr.phone, addr.addr,
        Math.random() > 0.7 ? pick(['请快点发货', '送到放门口即可', '不要打电话放驿站', '']): '',
        createdAt, createdAt,
      ]
    )
    const orderId = orderResult.insertId

    // ---- Step 4: 插入订单项 + 扣库存 + 写stock_movement ----
    for (const item of items) {
      await conn.execute(
        `INSERT INTO order_item (order_id, product_id, product_name, product_image, price, quantity, subtotal, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.productName, item.productImage, item.price, item.quantity, item.subtotal, createdAt, createdAt]
      )

      // 已付款订单扣库存
      if (status >= 1 && status !== 4) {
        const [invRows] = await conn.execute(
          'SELECT id, quantity, sales_count FROM inventory WHERE product_id = ?',
          [item.productId]
        )
        if (invRows.length) {
          const inv = invRows[0]
          const beforeQty = inv.quantity
          const afterQty = Math.max(0, beforeQty - item.quantity)
          await conn.execute(
            'UPDATE inventory SET quantity = ?, sales_count = sales_count + ? WHERE id = ?',
            [afterQty, item.quantity, inv.id]
          )
          await conn.execute(
            `INSERT INTO stock_movement (product_id, type, quantity, before_quantity, after_quantity, remark, order_id, created_at, updated_at)
            VALUES (?, 'order_out', ?, ?, ?, ?, ?, ?, ?)`,
            [item.productId, -item.quantity, beforeQty, afterQty, `订单${orderNo}扣减`, orderId, createdAt, createdAt]
          )
        }
      }
    }
    process.stdout.write(`\r生成订单 ${orderIndex}/${statusList.length} [${createdAt.slice(0,10)}] status=${status}`)
  }

  console.log('\n订单生成完成！')
  await conn.end()
})()
