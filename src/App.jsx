import "./App.css";
import axios from "axios";
import { useState } from "react";

function App() {
  let scanner = window.scanner;
  const [invoice, setInvoice] = useState();
  const [admission, setAdmission] = useState();

  const handleInputInv = (event) => {
    setInvoice(event.target.value.toUpperCase());
  };

  const handleInputAdm = (event) => {
    setAdmission(event.target.value.toUpperCase());
  };

  /** Scan: output PDF original and JPG thumbnails */
  function scanToPdfWithThumbnails() {
    scanner.scan(displayImagesOnPage, {
      // source_name: "default",
      source_name: "WIA-HP LJ400 M425 Scan",
      show_scanner_ui: false,
      use_asprise_dialog: false,
      twain_cap_setting: {
        ICAP_PIXELTYPE: "TWPT_RGB",
        ICAP_SUPPORTEDSIZES: "TWSS_USLETTER", // Paper size: TWSS_USLETTER, TWSS_A4, ...
      },
      output_settings: [
        {
          type: "return-base64",
          format: "pdf",
          pdf_text_line: "By ${USERNAME} on ${DATETIME}",
        },
        {
          type: "return-base64-thumbnail",
          format: "jpg",
          thumbnail_height: 600,
        },
      ],
    });
  }

  /** Processes the scan result */
  function displayImagesOnPage(successful, mesg, response) {
    if (!successful) {
      // On error
      console.error("Failed: " + mesg);
      return;
    }

    if (
      successful &&
      mesg != null &&
      mesg.toLowerCase().indexOf("user cancel") >= 0
    ) {
      // User cancelled.
      console.info("User cancelled");
      return;
    }

    var scannedImages = scanner.getScannedImages(response, true, false); // returns an array of ScannedImage
    for (
      var i = 0;
      scannedImages instanceof Array && i < scannedImages.length;
      i++
    ) {
      var scannedImage = scannedImages[i];
      processOriginal(scannedImage);
      // console.log(scannedImage.src)

      var thumbnails = scanner.getScannedImages(response, false, true); // returns an array of ScannedImage
      for (
        var j = 0;
        thumbnails instanceof Array && j < thumbnails.length;
        j++
      ) {
        let thumbnail = thumbnails[j];
        processThumbnail(thumbnail);
      }
    }
  }

  /** Images scanned so far. */
  var imagesScanned = [];
  var exportedImages = [];
  const scanned = [];
  let page = 0;

  /** Processes an original */
  function processOriginal(scannedImage) {
    imagesScanned.push(scannedImage);
    exportedImages.push(scannedImage.src);
  }

  /** Processes a thumbnail */
  function processThumbnail(scannedImage) {
    var elementImg = scanner.createDomElementFromModel({
      name: "img",
      attributes: {
        class: "scanned",
        src: scannedImage.src,
      },
    });
    scanned.push(elementImg);
    document.getElementById("images").appendChild(scanned[0]);
    console.log(scanned.length);
    // console.log(scanned[0])
    // document.getElementById("images").appendChild(elementImg);
  }

  function nextClick() {
    if (page > scanned.length - 1) {
      alert("last image");
      page = scanned.length;
    } else {
      // if (page === 0) {
      //   page++;
      // }
      document.getElementById("images").removeChild(scanned[page - 1]);
      document.getElementById("images").appendChild(scanned[page]);
      page++;
    }

    console.log(page);
  }

  function backClick() {
    if (page <= 0) {
      alert("last image");
      page = 0;
    } else if (page > scanned.length - 1) {
      page--;
      document.getElementById("images").removeChild(scanned[page]);
      document.getElementById("images").appendChild(scanned[page - 1]);
      page--;
    } else {
      document.getElementById("images").removeChild(scanned[page]);
      document.getElementById("images").appendChild(scanned[page - 1]);
      page--;
    }

    console.log(page);
  }

  async function handleClick() {
    const res = await axios({
      method: "post",
      url: "http://localhost:5000/upload",
      data: {
        invoice,
        admission,
        exportedImages,
      },
    });

    alert("Upload Success");
    console.log(res);
  }

  return (
    <>
      <h2>Scanner.js: Scan PDF and then Submit</h2>
      <form>
        Invoice:{" "}
        <input type="text" onChange={handleInputInv} name="invoice"></input>
      </form>
      <br></br>
      <form>
        Admission:{" "}
        <input type="text" onChange={handleInputAdm} name="admission"></input>
      </form>
      <br></br>
      <button type="button" onClick={scanToPdfWithThumbnails}>
        Scan
      </button>
      <div id="images"></div>
      <br></br>
      <button
        type="button"
        onClick={backClick}
        disabled={scanned.length <= 1 || page === 0 ? true : false}
      >
        Back
      </button>
      &nbsp;&nbsp;
      <button
        type="button"
        onClick={nextClick}
        disabled={
          scanned.length <= 1 || page === scanned.length - 1 ? true : false
        }
      >
        Next
      </button>
      <br></br>
      <br></br>
      <button
        type="button"
        onClick={handleClick}
        disabled={!scanned ? true : false}
      >
        Save
      </button>
    </>
  );
}

export default App;
