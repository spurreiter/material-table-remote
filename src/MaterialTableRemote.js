import React, {Component} from 'react'
import PropTypes from 'prop-types'
import MaterialTable, { MTable } from 'material-table'

export default class MaterialTableRemote extends Component {
  constructor (props) {
    super(props)

    this.state = {
      search: void 0,
      page: 0,
      limit: props.options.pageSize || MaterialTableRemote.defaultProps.options.pageSize,
      totalCount: 0,
      selected: {}
    }
  }

  onFetch () {
    const { search, page, limit, order, direction } = this.state
    this.props.onFetch({search, page, limit, order, direction})
  }
  onSelectionChange = (selectedRows, dataClicked) => {
    const { selected } = this.state
    const { tableData, ...item } = dataClicked
    const id = item[this.props.selectionId]
    if (tableData.checked) {
      selected[id] = item
    } else {
      delete selected[id]
    }
    this.setState({ selected })
    this.props.onSelectionChange && this.props.onSelectionChange(Object.values(selected))
  }
  onOrderChange = (column, direction) => {
    console.log(this.props.columns[column].field, column, direction) // TODO: implement
    const order = this.props.columns[column].field
    this.setState({order, direction}, () => this.onFetch())
  }
  onSearchChange = (search) => {
    const { limit } = this.state
    this.setState({ search, page: 0 }, () => this.onFetch())
  }
  onChangePage = (page) => {
    this.setState({ page }, () => this.onFetch())
  }
  onChangeRowsPerPage = (pageSize) => {
    const { page, limit } = this.state
    const _page = Math.floor((page * limit) / pageSize)
    this.setState({ page: _page, limit: pageSize }, () => this.onFetch())
  }

  render () {
    const { page, selected } = this.state
    const {
      props,
      onChangePage,
      onChangeRowsPerPage,
      onSearchChange,
      onOrderChange,
      onSelectionChange
    } = this
    const data = checked(this.props.selectionId, selected, this.props.data)
    const _props = {
      ...props,
      page,
      data,
      onChangePage,
      onChangeRowsPerPage,
      onSearchChange,
      onOrderChange,
      onSelectionChange
    }

    return (
      <MaterialTable {..._props} />
    )
  }
}

MaterialTableRemote.propTypes = {
  ...MTable.propTypes,
  onFetch: PropTypes.func.isRequired,
  selectionId: PropTypes.string
}

MaterialTableRemote.defaultProps = {
  ...MTable.defaultProps,
  selectionId: 'id'
}

/**
 * Apply checked state to data based on `selected` map object
 * @param {string} selectionId
 * @param {object} selected
 * @param {array<object>} data
 */
function checked (selectionId, selected, data) {
  return (data || []).map(item => {
    const _id = item[selectionId]
    const obj = selected[_id]
      ? { tableData: { checked: true } }
      : {}
    return Object.assign(obj, item)
  })
}
