import React from "react";
import MaterialTable from "@material-table/core";
import { Paper, TablePagination } from "@mui/material";
import { Container, Row, Col } from "react-bootstrap";
import { BsTrash, BsDownload } from "react-icons/bs";
import { tableIcons, DownloadBedSetDialog } from "../Components";
import bedhost_api_url from "../const/server";
import "../style/splash.css";
import axios from "axios";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class CreateBedSet extends React.Component {
  constructor() {
    super();
    this.state = {
      myBedSetName: "",
      myBedSet: JSON.parse(localStorage.getItem('myBedSet')),
      myBedSetIdx: "",
      url: {}
    };
  }

  async componentDidMount() {
    if (this.state.myBedSet) {
      this.getBedIdx()
      this.getFileUrl()
    }

  }

  async createBedSet() {
    // hide before process myBEDSet function is complete 
    // let md = await api.post(
    //   `/bedset/create/${this.state.myBedSetName}/${this.state.myBedSetIdx}`).then(({ data }) => data)

    // alert("Your BED set has been submitted for processing!")

    localStorage.clear();
    this.setState({ myBedSet: JSON.parse(localStorage.getItem('myBedSet')), })
  }

  handleChange(e) {
    this.setState({ myBedSetName: e.target.value });

  }
  getBedIdx() {
    let id_list = []
    id_list.push(
      this.state.myBedSet.map((bed) => {
        return bed.md5sum;
      })
    )

    // idx_list = encodeURIComponent(
    //   idx_list.toString()
    // )

    this.setState({
      myBedSetIdx: id_list
    })
    this.forceUpdate();
  }


  async getFileUrl() {
    try {
      const urls = {};
      const promises = this.state.myBedSet.map(async (bed) => {
        const url = await api.get(`${bedhost_api_url}/objects/bed.${bed.md5sum}.bedfile/access/http`).then(({ data }) => data);
        urls[bed.md5sum] = url;
      });

      // Wait for all promises to resolve
      await Promise.all(promises);

      this.setState({
        url: urls,
      });
    } catch (error) {
      // Handle errors, e.g., log the error or throw an exception
      console.error('Error fetching URLs:', error);
    }
  }

  render() {
    return (
      <React.StrictMode>
        <div
          className="conten-body"
        >
          {this.state.myBedSet ? (
            <Container
              style={{ width: "75%" }}
              fluid className="p-4"
            >
              <Row>
                <p style={{ fontSize: "9pt" }}>
                  * This function is still under development.
                  "My BED set" will not be added to BEDbase database.
                </p>
              </Row>
              <Row className="justify-content-between" style={{ margin: "0px" }}>
                <Col md="auto" style={{ padding: "0px", width: "950px" }}>
                  <h1>My BED Set</h1>
                </Col>
                <Col md="auto" className="align-items-end" style={{ padding: "0px" }}>
                  <DownloadBedSetDialog
                    bedfiles={this.state.myBedSetIdx}
                    btn={'Download My BED Set'}
                  />
                </Col>
                <Col md="auto" className="align-items-end" style={{ padding: "0px" }}>
                  <button
                    className="float-right btn btn-search"
                    onClick={this.createBedSet.bind(this)}
                  >
                    Empty My BED Set
                  </button>
                </Col>
              </Row>
              <MaterialTable
                title="My BED Set"
                icons={tableIcons}
                columns={[
                  {
                    title: 'Name',
                    field: 'name',
                    cellStyle: {
                      width: 1300,
                    }
                  },
                  { title: 'md5sum', field: 'md5sum', hidden: true, }
                ]}
                data={this.state.myBedSet}
                actions={[
                  rowData => ({
                    icon: () => <a
                      href={
                        this.state.url[rowData.md5sum]}
                    >
                      <BsDownload className="my-icon" />
                    </a>,
                    tooltip: 'Save User',
                    onClick: (event, rowData) => this.getFileUrl(rowData)
                  }),
                  {
                    icon: () => <BsTrash className="my-icon" />,
                    tooltip: 'Delete BED file',
                    onClick: (event, rowData) =>
                      new Promise((resolve, reject) => {
                        setTimeout(() => {
                          const dataDelete = [...this.state.myBedSet];
                          const index = rowData.tableData.id;
                          dataDelete.splice(index, 1);
                          this.setState({
                            myBedSet: dataDelete
                          }, () => {
                            localStorage.setItem('myBedSet', JSON.stringify(this.state.myBedSet))
                          });
                          resolve()
                        }, 1000)
                      }),
                  }
                ]}
                options={{
                  headerStyle: {
                    backgroundColor: "#264653",
                    color: "#FFF",
                    fontWeight: "bold",
                  },
                  actionsColumnIndex: -1,
                  actionsCellStyle: { justifyContent: "right" },
                  paging: true,
                  search: false,
                  toolbar: false,
                  idSynonym: 'md5sum',
                }}
                components={{
                  Container: (props) => <Paper {...props} elevation={0} />,
                  Pagination: (props) => (
                    <Row className="justify-content-end">
                      <TablePagination component="div"
                        {...props}
                      />
                    </Row>
                  ),
                }}
              />
              {/* 
                // hide before process myBEDSet function is complete
              <input
                type="text"
                placeholder="My BED set name"
                style={{ height: "33px", fontSize: 12 }}
                className="float-right"
                value={this.state.myBedSetName}
                onChange={this.handleChange.bind(this)}
              /> */}
            </Container>
          ) : (
            <Container style={{ width: "75%" }} fluid className="p-4">
              <h1 style={{ color: "#e76f51" }} >
                Your BED set cart is empty.
              </h1>
            </Container>
          )
          }
        </div>
      </React.StrictMode>
    );
  }
}
