import React from "react";
import MaterialTable from "material-table";
import { Paper } from "@material-ui/core";
import { Container, Row, Col } from "react-bootstrap";
import { BsTrash, BsDownload } from "react-icons/bs";
import { tableIcons, DownloadBedSetDialog } from "../Components";
import bedhost_api_url from "../const/server";
import "../style/splash.css";
// import axios from "axios";

// const api = axios.create({
//   baseURL: bedhost_api_url,
// });

export default class CreateBedSet extends React.Component {
  constructor() {
    super();
    this.state = {
      myBedSetName: "",
      myBedSet: JSON.parse(localStorage.getItem('myBedSet')),
      myBedSetIdx: ""
    };
  }

  async componentDidMount() {
    if (this.state.myBedSet) {
      this.getBedIdx()
    }

  }

  async createBedSet() {
    // hide before process myBEDSet function is complete 
    // let md = await api.post(
    //   `/api/bedset/create/${this.state.myBedSetName}/${this.state.myBedSetIdx}`).then(({ data }) => data)

    // alert("Your BED set has been submitted for processing!")

    localStorage.clear();
    window.location.reload(true);
  }

  handleChange(e) {
    this.setState({ myBedSetName: e.target.value });

  }
  getBedIdx() {
    let idx_list = []

    idx_list.push(
      this.state.myBedSet.map((bed) => {
        return bed.id;
      })
    )

    idx_list = encodeURIComponent(
      idx_list.toString()
    )

    this.setState({
      myBedSetIdx: idx_list
    })
    this.forceUpdate();
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
              <Row style={{ margin: "0px" }}>
                <Col md="auto" style={{ padding: "0px", width: "969px" }}>
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
                        `${bedhost_api_url}/api/bed/${rowData.md5sum}/file/bed`}
                    >
                      <BsDownload className="my-icon" />
                    </a>,
                    tooltip: 'Save User',
                    onClick: (event, rowData) => alert(`Download ${rowData.name}`)
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
                  // actionsCellStyle: { justifyContent: "right" },
                  paging: true,
                  search: false,
                  toolbar: false,
                }}
                components={{
                  Container: (props) => <Paper {...props} elevation={0} />,
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
