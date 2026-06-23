import Mock from 'mockjs'

function paramToObj(url) {
  const search = url.split('?')[1]
  if (!search) return {}
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

const avatarPool = [
  'https://jiangwen-admin.oss-cn-beijing.aliyuncs.com/user.jpg',
  'https://jiangwen-admin.oss-cn-beijing.aliyuncs.com/user2.jpg'
]

for (let i = 0; i < count; i++) {
  mockList.push({
    id: 20000 + i,
    phone: Mock.Random.string('number', 11),
    nickname: Mock.Random.cname(),
    avatar: Mock.Random.pick(avatarPool),
    open_id: Mock.Random.guid(),
    status: Mock.Random.integer(0, 1),
    createdAt: Mock.Random.datetime(),
    updatedAt: Mock.Random.datetime()
  })
}

export default {
  getMemberList: (params) => {
    const { nickname, phone, status, page = 1, limit = 10 } = paramToObj(params.url)

    let list = mockList.filter(item => {
      if (nickname && item.nickname.indexOf(nickname) === -1) return false
      if (phone && item.phone.indexOf(phone) === -1) return false
      if (status !== undefined && status !== '' && item.status !== Number(status)) return false
      return true
    })

    list.sort((a, b) => b.id - a.id)

    const pageList = list.slice((page - 1) * limit, page * limit)

    return {
      code: 200,
      message: 'success',
      result: { total: list.length, list: pageList }
    }
  },

  createMember: (data) => {
    const current = JSON.parse(data.body)
    mockList.unshift({
      ...current,
      id: mockList.length ? mockList[mockList.length - 1].id + 1 : 20001,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return { code: 200, message: 'success', result: null }
  },

  updateMember: (data) => {
    const current = JSON.parse(data.body)
    mockList.forEach(e => {
      if (e.id === current.id) {
        Object.assign(e, current, { updatedAt: new Date().toISOString() })
      }
    })
    return { code: 200, message: '编辑成功', result: null }
  },

  deleteMember: (data) => {
    const { id } = JSON.parse(data.body)
    if (!id) return { code: -999, message: '参数不正确' }
    mockList = mockList.filter(e => e.id !== id)
    return { code: 200, message: '删除成功', result: null }
  },

  batchDeleteMember: (data) => {
    const { ids } = JSON.parse(data.body)
    if (!ids || !ids.length) return { code: -999, message: '参数不正确', result: null }
    mockList = mockList.filter(e => !ids.includes(e.id))
    return { code: 200, message: '批量删除成功', result: null }
  }
}
