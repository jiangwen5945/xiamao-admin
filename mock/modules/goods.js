import Mock from 'mockjs'

function paramToObj(url) {
  const search = url.split('?')[1]
  if (!search) {
    return {}
  }
  const params = {}
  search.split('&').forEach(pair => {
    const [key, rawVal] = pair.split('=')
    const val = decodeURIComponent(rawVal || '')
    if (key.endsWith('[]')) {
      const cleanKey = key.slice(0, -2)
      if (!params[cleanKey]) params[cleanKey] = []
      params[cleanKey].push(val)
    } else {
      params[key] = val
    }
  })
  return params
}

let mockList = []
const count = 200

const categoryMap = {
  35000: '冻品类', 35001: '小笼包1', 35002: '小笼包2', 35003: '小笼包3',
  36000: '调味品', 36001: '味精1', 36002: '味精2', 36003: '味精3',
  37000: '药材/干货', 37001: '丹参1', 37002: '丹参2', 37003: '丹参3'
}
const categoryIds = Object.keys(categoryMap).map(Number)
const brandList = ['三全', '思念', '安井', '海天', '李锦记', '同仁堂', '双汇', '金龙鱼']
const tagPool = ['新品', '热销', '推荐', '礼品', '夏季', '经典']
const specNamePool = ['颜色', '尺寸', '包装', '尺码', '轴体', '封面']
const specValuePool = ['红色', '蓝色', '白色', '大号', '小号', '礼盒装', '简约装', '标准']

for (let i = 0; i < count; i++) {
  const catId = Mock.Random.pick(categoryIds)
  const tagCount = Mock.Random.integer(1, 4)
  const shuffledTags = [...tagPool].sort(() => 0.5 - Math.random())
  const specCount = Mock.Random.integer(0, 3)

  mockList.push({
    id: 10000 + i,
    name: Mock.Random.ctitle(3, 6),
    description: Mock.Random.csentence(10, 30),
    detail: '<h3>商品详情</h3><p>' + Mock.Random.csentence(20, 50) + '</p><p>' + Mock.Random.csentence(20, 50) + '</p>',
    brand: Mock.Random.pick(brandList),
    price: Mock.Random.integer(10, 200),
    category_id: catId,
    Category: { name: categoryMap[catId] },
    tags: shuffledTags.slice(0, tagCount),
    sort: Mock.Random.integer(1, 100),
    stock: Mock.Random.integer(10, 1000),
    status: Mock.Random.integer(0, 1),
    sales: Mock.Random.integer(100, 1000),
    remark: Mock.Random.csentence(5, 15),
    images: Array.from({ length: Mock.Random.integer(1, 4) }, (_, idx) => ({
      url: Mock.Random.image('120x120'),
      sort: idx + 1,
      type: idx === 0 ? 'main' : 'carousel'
    })),
    specs: Array.from({ length: specCount }, () => ({
      name: Mock.Random.pick(specNamePool),
      value: Mock.Random.pick(specValuePool),
      price: Mock.Random.integer(0, 50),
      stock: Mock.Random.integer(10, 200)
    })),
    createdAt: Mock.Random.datetime(),
    updatedAt: Mock.Random.datetime()
  })
}

let topCategoryList = Mock.mock({
  'list|3': [
    {
      "id|+1": [35000, 36000, 37000],
      "parentId": null,
      "childs|+1": [
        [{ id: 35001, name: '小笼包1' }, { id: 35002, name: '小笼包2' }, { id: 35003, name: '小笼包3' }],
        [{ id: 36001, name: '味精1' }, { id: 36002, name: '味精2' }, { id: 36003, name: '味精3' }],
        [{ id: 37001, name: '丹参1' }, { id: 37002, name: '丹参2' }, { id: 37003, name: '丹参3' }]
      ],
      "name|+1": ["冻品类", "调味品", "药材/干货"],
      "level": '1',
      "productCount|100-500": 100,
      "productUnit": "件",
      "navStatus|1": [0, 1],
      "showStatus|1": [0, 1],
      "sort": 1,
      "icon": null,
      "keywords|+1": ["冻品类", "调味品", "药材/干货"],
      "description": null
    }
  ]
})

let subCategoryList = Mock.mock({
  'list|3': [
    {
      'id|+1': [35001, 35002, 35003],
      'parentId': 35000,
      "childs|10": [{ id: 10000 + Mock.mock('@increment') }],
      "name|+1": ['小笼包1', '小笼包2', '小笼包3'],
      "level": '2',
      "productCount|100-500": 100,
      "productUnit": "件",
      "navStatus|1": [0, 1],
      "showStatus|1": [0, 1],
      "sort": 1,
      "icon": null,
      "keywords|+1": ['小笼包1', '小笼包2', '小笼包3'],
      "description": null
    }
  ]
})

export default {
  getGoodsList: (params) => {
    const { name, category_id, brand, price_min, price_max, status, tags, page = 1, limit = 10, sortField, sortOrder } = paramToObj(params.url)

    let goodsList = mockList.filter(goods => {
      if (name && !goods.name.includes(name)) return false
      if (category_id && goods.category_id !== Number(category_id)) return false
      if (brand && !goods.brand.includes(brand)) return false
      if (price_min && goods.price < Number(price_min)) return false
      if (price_max && goods.price > Number(price_max)) return false
      if (status !== undefined && status !== '' && goods.status !== Number(status)) return false
      if (tags) {
        const tagArr = tags.split(',')
        if (!tagArr.every(t => (goods.tags || []).includes(t))) return false
      }
      return true
    })

    if (sortField) {
      goodsList.sort((a, b) => {
        const va = a[sortField] || 0
        const vb = b[sortField] || 0
        return sortOrder === 'ascending' ? va - vb : vb - va
      })
    } else {
      goodsList.sort((a, b) => b.id - a.id)
    }

    const pageList = goodsList.slice((page - 1) * limit, page * limit)

    return {
      code: 200,
      message: 'success',
      result: { total: goodsList.length, list: pageList }
    }
  },

  createGoods: (data) => {
    const currentGoods = JSON.parse(data.body)
    mockList.unshift({
      ...currentGoods,
      id: mockList.length ? mockList[mockList.length - 1].id + 1 : 10001,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return { code: 200, message: 'success', result: null }
  },

  deleteGoods: (data) => {
    const { id } = JSON.parse(data.body)
    if (!id) return { code: -999, message: '参数不正确' }
    mockList = mockList.filter(e => e.id !== id)
    return { code: 200, message: '删除成功', result: null }
  },

  updateGoods: (data) => {
    const currentGoods = JSON.parse(data.body)
    mockList.forEach(e => {
      if (e.id === currentGoods.id) {
        Object.assign(e, currentGoods, { updatedAt: new Date().toISOString() })
      }
    })
    return { code: 200, message: '编辑成功', result: null }
  },

  batchDeleteGoods: (data) => {
    const { ids } = JSON.parse(data.body)
    if (!ids || !ids.length) return { code: -999, message: '参数不正确', result: null }
    mockList = mockList.filter(e => !ids.includes(e.id))
    return { code: 200, message: '批量删除成功', result: null }
  },

  batchUpdateGoodsStatus: (data) => {
    const { ids, status } = JSON.parse(data.body)
    if (!ids || !ids.length) return { code: -999, message: '参数不正确', result: null }
    mockList.forEach(e => {
      if (ids.includes(e.id)) {
        e.status = status
        e.updatedAt = new Date().toISOString()
      }
    })
    return { code: 200, message: '批量更新成功', result: null }
  },

  getGoodsCategory: (params) => {
    const { name, level, page = 1, limit = 10 } = paramToObj(params.url)
    let allCategoryList = []
    if (level === '1') allCategoryList = [...topCategoryList.list]
    else if (level === '2') allCategoryList = [...subCategoryList.list]
    else allCategoryList = [...topCategoryList.list, ...subCategoryList.list]

    const categoryList = allCategoryList.filter(e => {
      if (name && e.name.indexOf(name) === -1) return false
      return true
    })
    const pageList = categoryList.slice((page - 1) * limit, page * limit)
    return {
      code: 200,
      message: "success",
      result: { list: pageList, total: categoryList.length }
    }
  },

  createGoodsCategory: (data) => {
    const current = JSON.parse(data.body)
    const allIds = [...topCategoryList.list.map(c => c.id), ...subCategoryList.list.map(c => c.id)]
    const maxId = Math.max(...allIds, 99999)
    topCategoryList.list.push({
      id: maxId + 1,
      parentId: null,
      name: current.name,
      sort: current.sort || 1,
      level: '1',
      productCount: 0,
      productUnit: '件',
      navStatus: 1,
      showStatus: 1,
      icon: null,
      keywords: current.name || '',
      description: null,
      childs: []
    })
    return { code: 200, message: 'success', result: null }
  },

  deleteGoodsCategory: (data) => {
    const { id } = JSON.parse(data.body)
    if (!id) return { code: -999, message: '参数不正确' }
    topCategoryList.list = topCategoryList.list.filter(e => e.id !== id)
    subCategoryList.list = subCategoryList.list.filter(e => e.id !== id)
    return { code: 200, message: '删除成功', result: null }
  },

  updateGoodsCategory: (data) => {
    const current = JSON.parse(data.body)
    topCategoryList.list.forEach(e => {
      if (e.id === current.id) Object.assign(e, current)
    })
    subCategoryList.list.forEach(e => {
      if (e.id === current.id) Object.assign(e, current)
    })
    return { code: 200, message: '编辑成功', result: null }
  }
}
