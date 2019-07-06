import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
// import { linkTo } from '@storybook/addon-links'

import MaterialTable from 'material-table'
import { MaterialTableRemote } from '../src'
import Chance from 'chance'

const chance = new Chance()

class UniqueInteger {
  constructor () {
    this.set = new Set()
  }
  get (opts) {
    while (1) {
      const i = chance.integer(opts)
      if (!this.set.has(i)) {
        this.set.add(i)
        return i
      }
    }
  }
}

class TableData {
  constructor (items = 12) {
    this.columns = [
      { title: 'Number', field: 'number' },
      { title: 'Firstname', field: 'first' },
      { title: 'Lastname', field: 'last' }
    ]
    const ui = new UniqueInteger()
    this.data = Array(items).fill().map(() => ({
      number: ui.get({ min: 1000, max: 1999 }),
      first: chance.first(),
      last: chance.last()
    }))
  }
  search ({ search = '', skip, limit, orderBy, order }) {
    // console.log({search, skip, limit})
    // debugger
    search = search.toLowerCase()

    const isNumber = (n) => /^[\d.]+$/.test(n)

    const sorter = (a, b) => {
      if (orderBy) {
        const _a = a[orderBy]
        const _b = b[orderBy]
        const areNumbers = isNumber(_a) && isNumber(_b)
        if (areNumbers) {
          return order === 'asc'
            ? _a - _b
            : _b - _a
        }
        if (order === 'asc') {
          return String(_a).localeCompare(_b)
        } else {
          return String(_b).localeCompare(_a)
        }
      } else {
        return 0
      }
    }

    return new Promise(resolve => {
      const results = (!search
        ? this.data
        : this.data.filter(item =>
          item.first.toLowerCase().indexOf(search) !== -1 ||
          item.last.toLowerCase().indexOf(search) !== -1
        )).sort(sorter)
      const count = results.length
      const data = skip || limit
        ? results.slice(skip, skip + limit)
        : results

      setTimeout(() => {
        resolve({
          data,
          limit,
          skip,
          count
        })
      }, 500)
    })
  }
}

storiesOf('MaterialTableRemote', module)
  .add('MaterialTable', () => {
    const td = new TableData(22)

    class TestStore extends Component {
      constructor (props) {
        super(props)
        this.state = {
          page: 0,
          limit: 5,
          totalCount: 0
        }
        this.selected = {}
      }
      componentDidMount () {
        const { page, limit } = this.state
        this.actionSearch({ page, limit })
      }

      // action
      actionSearch ({ search, page, limit }) {
        const skip = page * limit
        console.log('search', { search, limit, skip })
        this.setState(() => ({ loading: true }))
        td.search({ search, limit, skip }).then(result => {
          // store
          const { data, limit, skip, count } = result
          // onChange
          const page = limit
            ? Math.floor(skip / limit)
            : 0
          console.log('result', { data, page, count })

          function addTableData (selectionId, selected, data) {
            return data.map(item => {
              const _id = item[selectionId]
              const obj = selected[_id]
                ? { tableData: { checked: true } }
                : {}
              return Object.assign(obj, item)
            })
          }
          const _data = addTableData(this.props.selectionId, this.selected, data)
          this.setState(() => ({ loading: false, data: _data, search, page, totalCount: count }))
        })
      }

      onSelectionChange = (selectedRows, dataClicked) => {
        const { tableData, ...item } = dataClicked
        const id = item[this.props.selectionId]
        if (tableData.checked) {
          this.selected[id] = item
        } else {
          delete this.selected[id]
        }
        console.log(Object.keys(this.selected)) // TODO: remove
      }
      onOrderChange = (...args) => {
        console.log(args) // TODO:
      }
      onSearchChange = (search) => {
        const { limit } = this.state
        this.actionSearch({ search, page: 0, limit })
      }
      onChangePage = (page) => {
        const { search, limit } = this.state
        this.actionSearch({ search, page, limit })
      }
      onChangeRowsPerPage = (pageSize) => {
        const { search, page, limit } = this.state
        const _page = Math.floor((page * limit) / pageSize)
        this.setState({ limit: pageSize })
        this.actionSearch({ search, page: _page, limit: pageSize })
      }

      render () {
        const { data, page, totalCount, loading } = this.state
        const props = {
          columns: td.columns,
          data,
          page,
          isLoading: loading,
          totalCount,
          onChangePage: this.onChangePage,
          onChangeRowsPerPage: this.onChangeRowsPerPage,
          onSearchChange: this.onSearchChange,
          onOrderChange: this.onOrderChange,
          onSelectionChange: this.onSelectionChange,
          title: 'Demo Title'
        }
        return (
          <MaterialTable
            {...props}
            options={{
              showSelectAllCheckbox: false,
              selection: true
            }}
          />
        )
      }
    }

    TestStore.propTypes = {
      selectionId: PropTypes.string
    }
    TestStore.defaultProps = {
      selectionId: 'number'
    }

    return (
      <div>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
        <TestStore />
      </div>
    )
  })
  .add('Component', () => {
    const td = new TableData(22)

    class TestStore extends Component {
      constructor (props) {
        super(props)
        this.state = {
          totalCount: 0
        }
        this.selected = {}
      }
      componentDidMount () {
        const { page, limit } = this.state
        this.actionSearch({ page, limit })
      }

      // action
      actionSearch = ({ search, page, skip, limit, orderBy, order }) => {
        console.log('search', { search, limit, skip, orderBy, order })
        this.setState(() => ({ loading: true }))
        td.search({ search, limit, skip, orderBy, order }).then(result => {
          // store -> onChange
          const { data, count } = result
          console.log('result', { data, count })
          this.setState(() => ({ loading: false, data, totalCount: count }))
        })
      }

      render () {
        const { data, totalCount, loading } = this.state
        const props = {
          columns: td.columns,
          data,
          isLoading: loading,
          totalCount,
          title: 'Demo Title',
          onFetch: this.actionSearch,
          selectionId: 'number',
          onSelectionChange: action('onSelectionChange'),
          options: {
            showSelectAllCheckbox: false,
            selection: true,
            showTextRowsSelected: false
          }
        }
        return (
          <MaterialTableRemote {...props} />
        )
      }
    }

    return (
      <div>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
        <TestStore />
      </div>
    )
  })
