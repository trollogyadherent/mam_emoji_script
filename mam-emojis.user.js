// ==UserScript==
// @name        jack's MaM Emoji Script
// @namespace   Violentmonkey Scripts
// @match       https://www.myanonamouse.net/*
// @grant       none
// @version     1.0
// @author      -
// @description 12/17/2023, 1:06:52 PM
// ==/UserScript==

var emojiSettings = null;
var emojis = null;
var emojiOrder = null;
var emojiDisabled = null;


/* Observes the page for any new images in the shoutbox or on the bitbucket page */
function handleMouseOver(event) {
  if (document.getElementById('emojiQuickAddButton')) {
    return ;
  }
  const img = event.target;
  const plusButton = document.createElement('button');
  plusButton.id = 'emojiQuickAddButton';
  plusButton.innerHTML = '➕';
  //plusButton.style.position = 'absolute';
  plusButton.style.transform = 'translate(-90%, -90%)';
  plusButton.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  plusButton.style.border = 'none';
  plusButton.style.padding = '5px';
  plusButton.style.cursor = 'pointer';
  plusButton.title = 'Add emoji';
  plusButton.style.width = '5px';
  plusButton.style.height = '5px';

  // Add an event listener to the plus button
  plusButton.addEventListener('click', function(event) {
    event.preventDefault();
      // Your custom action when the plus button is clicked
      //console.log('Button clicked!');
    let real_coords = getEffectiveCoords(plusButton);
    showUploadMenu(real_coords.x, real_coords.y, img);
  });

    // Create a container div for the image and the plus button
    const container = document.createElement('span');
    //container.style.position = 'relative';
  img.before(container);
    container.appendChild(img); // Clone the image to avoid the DOMException
    container.appendChild(plusButton);
    // Remove the container on mouseout
    container.addEventListener('mouseleave', function handleMouseLeave() {
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.after(img);
      container.remove();
    });

}
// Function to check if the img element has the data-ssps attribute
function hasAlt(img) {
  if (!img.hasAttribute('alt')) {
    return false;
  }
  return (img.alt.length != 0);
}
/* Triggers when new elements are appended to the DOM */
function handleMutation(mutationsList, observer) {
  mutationsList.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        // Check if the added node is an img element without the data-ssps attribute
        if (node.tagName === "IMG") {
          //console.log(node);
        }
        if (node.tagName === "IMG" && (!hasAlt(node) || node.src.includes('cdn.myanonamouse.net/pic/smilies') || node.src.includes('cdn.myanonamouse.net/imagebucket'))) {
          node.addEventListener("mouseover", handleMouseOver);
        }
      });
    }
  });
}

/*// Create a MutationObserver with the callback function
const observer = new MutationObserver(handleMutation);

// Specify the target node and the configuration options
const targetNode = document.body; // You can change this to observe a specific element
const config = { childList: true, subtree: true };

// Start observing the target node for mutations
observer.observe(targetNode, config);*/


/* Loads variables from browsers localstorage (COOKIES?!) */
function loadDefaultSettings() {
  emojiSettings_entry = localStorage.getItem('mam_emoji_settings');
  if (emojiSettings_entry) {
    emojiSettings = JSON.parse(emojiSettings_entry);
  } else {
    emojiSettings = {};
  }
  emojis_entry = localStorage.getItem('mam_emojis');
  if (emojis_entry) {
    emojis = JSON.parse(emojis_entry);
  } else {
    emojis = {};
  }
  emojiOrder_entry = localStorage.getItem('mam_emoji_order');
  if (emojiOrder_entry) {
    emojiOrder = JSON.parse(emojiOrder_entry);
  } else {
    emojiOrder = [];
  }
  emojiDisabled_entry = localStorage.getItem('mam_emoji_disabled');
  if (emojiDisabled_entry) {
    emojiDisabled = JSON.parse(emojiDisabled_entry);
  } else {
    emojiDisabled = [];
  }

  if (!('load_default' in emojiSettings)) {
    emojiSettings.load_default = true;
  }
  if (!('default_width' in emojiSettings)) {
    emojiSettings.default_width = 18;
  }
  if (!('default_height' in emojiSettings)) {
    emojiSettings.default_height = 18;
  }
}
loadDefaultSettings();

/* Waits for page to be loaded, responsible for hotswapping custom emoji codes for bbcode */
function main() {
  console.log('Hello from the mam shoutbox emoji script by jack!');
  let shoutboxForm = document.getElementById("sbform");
  if (shoutboxForm) {
    /* Attach event listener to the form submit button */
    let sendButton = document.querySelector('input[name="send"]');
    if (sendButton) {
      sendButton.addEventListener("click", function (event) {
      // Prevent the default form submission
      //event.preventDefault();

      // Alert when the user presses the send button
      console.log("Shout button pressed!");
      let sb_text = document.getElementById('shbox_text').value;
      for (key in emojis) {
        let to_replace = ':' + key + ':';
        sb_text = sb_text.replaceAll(to_replace, `[img]${emojis[key]}?name=${key}&_=MaM_Emojis_by_jack[/img]`);
      }
      sb_text = document.getElementById('shbox_text').value = sb_text;
      console.log(sb_text);
      });
    }

    // hooks for existing emojis in the shoutbox
    const shoutbox_observer = new MutationObserver(handleMutation);
    // Specify the target node and the configuration options
    const targetNode = document.getElementById('sbf'); // You can change this to observe a specific element
    const config = { childList: true, subtree: true };
    // Start observing the target node for mutations
    shoutbox_observer.observe(targetNode, config);
  }

  if (window.location.toString().includes('www.myanonamouse.net/bitbucket-upload.php')) {
    let elementWithClasses = document.querySelector('.blockBodyCon.cen');
    if (elementWithClasses) {
      const bucket_observer = new MutationObserver(handleMutation);
      const bucket_config = { childList: true, subtree: true };
      bucket_observer.observe(elementWithClasses, bucket_config);

      let images = elementWithClasses.querySelectorAll('img');
      for (let i = 0; i < images.length; i ++) {
        images[i].addEventListener("mouseover", handleMouseOver);
      }
      console.log('MaM emoji script: hooked into bucket page');
    }
  }

  if (!shoutboxForm) {
    return ;
  }
}
window.addEventListener('load', main, false);

/* Returns the real coordinates of an element, even when the user has scrolled on the page */
/* The veracity of these coordinates has been fact checked by real American Pqtriots */
function getEffectiveCoords(element) {
  let div = element;
  let mouse_x_offset = 40;
  let mouse_y_offset = -50;
  let effective_x = event.pageX + mouse_x_offset;
  let effective_y = event.pageY + mouse_y_offset;

  let clientWidth = document.documentElement.clientWidth;
  let clientHeight = document.documentElement.clientHeight;

  if (effective_x + div.offsetWidth > clientWidth) {
    effective_x -= Math.abs(clientWidth - (effective_x + div.offsetWidth));
    let additional_offset = 75;
    if (effective_y + div.offsetHeight + additional_offset > clientHeight) {
      effective_y -= (div.offsetHeight);
    } else {
      effective_y += additional_offset;
    }
  }
  if (effective_y + div.offsetHeight > clientHeight) {
    effective_y -= Math.abs(clientHeight - (effective_y + div.offsetHeight + 10));
  }
  return {x: effective_x, y: effective_y}
}

/* Parses the html received from the bitbucket upload page */
function extractUploadResult(htmlText) {
    // Create a DOMParser instance
    const parser = new DOMParser();

    // Parse the HTML text
    const doc = parser.parseFromString(htmlText, 'text/html');

    const uploadStatusElement = doc.querySelector('div#mainBody');

    if (!uploadStatusElement) {
        return { success: false, message: 'Unable to determine upload status' };
    }

    // Check if the upload succeeded
    const h2Elem = uploadStatusElement.querySelector('h2');
    if (h2Elem) {
        const successLink = uploadStatusElement.querySelector('td.text a');
        if (successLink) {
            const successMessage = successLink.getAttribute('href');
            return { success: true, url: successMessage };
        } else {
            return { success: false, message: uploadStatusElement.querySelector('td.text').textContent.trim() };
        }
    }

    // Default case (no success or failure information found)
    return { success: false, message: 'Unable to determine upload status' };

}

/* https://stackoverflow.com/a/18320662 */
function resample_single(canvas, width, height, resize_canvas) {
    var width_source = canvas.width;
    var height_source = canvas.height;
    width = Math.round(width);
    height = Math.round(height);

    var ratio_w = width_source / width;
    var ratio_h = height_source / height;
    var ratio_w_half = Math.ceil(ratio_w / 2);
    var ratio_h_half = Math.ceil(ratio_h / 2);

    var ctx = canvas.getContext("2d");
    var img = ctx.getImageData(0, 0, width_source, height_source);
    var img2 = ctx.createImageData(width, height);
    var data = img.data;
    var data2 = img2.data;

    for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
            var x2 = (i + j * width) * 4;
            var weight = 0;
            var weights = 0;
            var weights_alpha = 0;
            var gx_r = 0;
            var gx_g = 0;
            var gx_b = 0;
            var gx_a = 0;
            var center_y = (j + 0.5) * ratio_h;
            var yy_start = Math.floor(j * ratio_h);
            var yy_stop = Math.ceil((j + 1) * ratio_h);
            for (var yy = yy_start; yy < yy_stop; yy++) {
                var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                var center_x = (i + 0.5) * ratio_w;
                var w0 = dy * dy; //pre-calc part of w
                var xx_start = Math.floor(i * ratio_w);
                var xx_stop = Math.ceil((i + 1) * ratio_w);
                for (var xx = xx_start; xx < xx_stop; xx++) {
                    var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                    var w = Math.sqrt(w0 + dx * dx);
                    if (w >= 1) {
                        //pixel too far
                        continue;
                    }
                    //hermite filter
                    weight = 2 * w * w * w - 3 * w * w + 1;
                    var pos_x = 4 * (xx + yy * width_source);
                    //alpha
                    gx_a += weight * data[pos_x + 3];
                    weights_alpha += weight;
                    //colors
                    if (data[pos_x + 3] < 255)
                        weight = weight * data[pos_x + 3] / 250;
                    gx_r += weight * data[pos_x];
                    gx_g += weight * data[pos_x + 1];
                    gx_b += weight * data[pos_x + 2];
                    weights += weight;
                }
            }
            data2[x2] = gx_r / weights;
            data2[x2 + 1] = gx_g / weights;
            data2[x2 + 2] = gx_b / weights;
            data2[x2 + 3] = gx_a / weights_alpha;
        }
    }
    //clear and resize canvas
    if (resize_canvas === true) {
        canvas.width = width;
        canvas.height = height;
    } else {
        ctx.clearRect(0, 0, width_source, height_source);
    }

    //draw
    ctx.putImageData(img2, 0, 0);
}

/* resizes image to given size */
function resizeImage(file, x, y, originalFilename, emoji_name) {
    return new Promise((resolve, reject) => {
        /*if (x < 0 || y < 0) {
            // Directly resolve with the original image blob
            resolve(file);
            return;
        }*/

      if (file.type === 'image/gif') {
            // Directly resolve with the original image blob for GIFs
            resolve(file);
            return;
        }

        const img = new Image();
        img.onload = () => {
          if (x == img.width && y == img.height) {
            resolve(file);
            return;
          }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
          ctx.mozImageSmoothingEnabled = true;
          ctx.webkitImageSmoothingEnabled = true;
          ctx.msImageSmoothingEnabled = true;
          ctx.imageSmoothingEnabled = true;
            /*canvas.width = x;
            canvas.height = y;
            ctx.drawImage(img, 0, 0, x, y);
            canvas.toBlob(resolve, 'image/jpeg');*/

          // If x is negative, use the original image dimensions
           /* canvas.width = x < 0 ? img.width : x;
            if (x < 0) {
              x = img.width;
            }
          // if y is negative, make the y proportional
            if (y < 0) {
              canvas.height = canvas.width * img.height / img.width;
            }

            // Set a transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the image with transparency
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            */

          if (x < 0) {
              x = img.width;
            }
          // if y is negative, make the y proportional
            if (y < 0) {
              y = img.height * x / img.width;
            }
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          resample_single(canvas, x, y, true);
            // Convert the canvas to a blob with PNG format to preserve transparency
            canvas.toBlob(resolve, 'image/png');

        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/* Changes a file extension to png */
/*function changeImageExtension(filename) {
  // Split the filename into its name and extension
  const parts = filename.split('.');

  // If there is an extension, replace it with 'png'; otherwise, add '.png' as the extension
  const newFilename = parts.length > 1 ? parts.slice(0, -1).join('.') + '.png' : filename + '.png';

  return newFilename;
}*/
function changeImageExtension(filename) {
  // Split the filename into its name and extension
  const parts = filename.split('.');

  // If there is an extension and it's not 'gif', replace it with 'png'; otherwise, keep the original extension
  const newExtension = parts.length > 1 && parts[parts.length - 1].toLowerCase() !== 'gif' ? 'png' : parts[parts.length - 1];

  // Replace the original extension with the new one
  const newFilename = parts.slice(0, -1).join('.') + '.' + newExtension;

  return newFilename;
}

/* Gets file name from url */
function nameFromUrl(url) {
  let filename = 'image.png';
  try {
    filename = new URL(url).pathname.split('/').pop();
  } catch (e) {
    console.error(e);
  }
  return (filename);
}

/* Upload image from url */
function uploadImageFromRemote(url, x, y, emoji_name) {
  async function fetchImageAsBlob(url) {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
  }

  // Fetch the image and convert it to a Blob
  fetchImageAsBlob(url)
      .then(blob => {
          if (blob.type === 'image/gif') {
                // Directly call the uploadImage function with the original GIF blob
                uploadImage({ files: [blob] }, x, y, emoji_name);
                return;
            }

          // Create a File object with the Blob
          let name = nameFromUrl(url);
          const newFilename = changeImageExtension(name);
          const file = new File([blob], emoji_name + '.png', { type: 'image/png' });

          // Now, call the uploadImage function with the file parameter
          uploadImage({ files: [file] }, x, y, emoji_name);
      })
      .catch(error => {
          let result_p = document.getElementById('upload_status');
          result_p.innerText = `❌ Error fetching image: ${error}`;
          console.error('Error fetching image:', error);
      });
}

function getFileExtension(filename) {
  let parts = filename.split('.');
  if (parts.length == 1) {
    return ('');
  }
  return (parts.pop().toLowerCase());
}

function getDesiredExtendion(filename) {
  if (getFileExtension(filename) == 'gif') {
    return ('gif');
  }
  return ('png');
}

function generateRandomString(n) {
    let randomString           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for ( let i = 0; i < n; i++ ) {
      randomString += characters.charAt(Math.floor(Math.random()*characters.length));
   }
   return randomString;
}

/* Upload image from a file input */
function uploadImage(fileInput, x, y, emoji_name) {
    // Get the file from the input element
    let file = fileInput.files[0];

    // Check if a file is selected
    if (!file) {
        console.error('No file selected.');
        let result_p = document.getElementById('upload_status');
        result_p.innerText = '❌ No file selected';
        return;
    }

  const filename = `${emoji_name}-${generateRandomString(5)}.${getDesiredExtendion(file.name)}`; //changeImageExtension(file.name);
  resizeImage(file, x, y, filename, emoji_name)
        .then(resizedBlob => {
            // Create a FormData object and append the resized file to it
            const formData = new FormData();
            formData.append('file', resizedBlob, filename);

            // Perform the fetch request
            fetch('bitbucket-upload.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text(); // assuming the response is HTML
            })
            .then(html => {
                console.log('HTML response:', html);
                let result = extractUploadResult(html);
              let result_p = document.getElementById('upload_status');
              if (result.success) {
                // Add the new entry
                emojis[emoji_name] = result.url;
                // Save the updated data back to local storage
                localStorage.setItem('mam_emojis', JSON.stringify(emojis));
                emojiOrder.unshift(':' + emoji_name + ':');
                localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
                result_p.innerText = '✅ Success';
                loadCustomEmojis();
              } else {
                result_p.innerText = '❌' + result.message;
              }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        })
        .catch(error => {
            console.error('Error resizing image:', error);
        });
}

function checkEmojiNameAvailability(name) {
  if (name.length == 0) {
    let result_p = document.getElementById('upload_status');
    result_p.innerText = '❌ name should not be empty';
    return (false);
  }
  // Check if the name contains only alphanumeric characters
  const isAlphanumeric = /^[a-zA-Z0-9_]+$/.test(name);

  if (!isAlphanumeric) {
    let result_p = document.getElementById('upload_status');
    result_p.innerText = '❌ name should not contain special characters nor spaces';
    return (false);
  }

  for (let i = 0; i < smiliesList.length; i ++) {
    if (':' + name + ':' == smiliesList.value) {
      let result_p = document.getElementById('upload_status');
      result_p.innerText = '❌ an emoji with this name already exists';
      return (false);
    }
  }
  if (emojis[name]) {
    let result_p = document.getElementById('upload_status');
    result_p.innerText = '❌ an emoji with this name already exists';
    return (false);
  }

  // If the name is alphanumeric and not in local storage, it's available
  return (true);
}

/* Gets emoji name from url if there is one */
function urlGetName(url) {
  let paramString = url.split('?');
  if (paramString.length > 1) {
    paramString = paramString[1]
  } else {
    return (nameFromUrl(url));
  }
  let queryString = new URLSearchParams(paramString);
  if (!queryString.get('name')) {
    return (nameFromUrl(url));
  }
  return (queryString.get('name'));
}

/* Check if a url is cdn url */
function isCDNUrl(url) {
    const domainToCheck = 'cdn.myanonamouse.net';
    const urlObj = new URL(url);

    return urlObj.hostname === domainToCheck;
}

/* floating upload emoji menu */
function showUploadMenu(x, y, existingImage = null) {
  let floatingMenu = document.createElement('div');
  floatingMenu.id = 'floatingMenu';
  floatingMenu.style.position = 'absolute';
  floatingMenu.style.top = y + 'px'; // Adjust the top position as needed
  floatingMenu.style.left = x + 'px'; // Adjust the right position as needed
  floatingMenu.style.backgroundColor = 'white';
  floatingMenu.style.border = '1px solid #ccc';
  floatingMenu.style.padding = '10px';
  floatingMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
  floatingMenu.style.display = 'none';

  // Add content to the floating menu
  let prefilled_name = '';
  if (existingImage && urlGetName(existingImage.src)) {
    prefilled_name = urlGetName(existingImage.src);
  }
  let prefilled_width = emojiSettings.default_width;
  if (existingImage) {
    prefilled_width = existingImage.width;
  }
  let prefilled_height = emojiSettings.default_height;
  if (existingImage) {
    prefilled_height = existingImage.height;
  }
  floatingMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
      <h3 style='font-family: "Trebuchet MS",Verdana,Arial,Helvetica,sans-serif;'>Upload Emoji</h3>
      <button onclick="this.remove();" style="margin-left: auto;">❌</button>
      </div>

      <br>
      <label>
          Emoji name:
          <input type="text" id="emoji_name" value="${prefilled_name}">
      </label>
      `
      if (!existingImage) {
        floatingMenu.innerHTML += `<input type="file" id="fileInput" accept="image/*">`;
      }
      floatingMenu.innerHTML += `
      <button id="uploadButton">Upload</button>
      <br>
      <p id="upload_status"></p>
      <br>
      <label>
          <input type="checkbox" id="resizeCheckbox"> Resize
      </label>
      <br>
      <label>
          Width:
          <input type="number" id="widthInput" value="${prefilled_width}">
      </label>
      <label>
          Height:
          <input type="number" id="heightInput" value="${prefilled_height}">
      </label>
      <br>
      <br>
    <p>Note: Setting a negative height makes it proportional to the new width.</p>
    <p>Note: The emoji and its name will be visible to moderators and users.</p>
    <p>Note: you can see your own uploads <a href="https://www.myanonamouse.net/bitbucket-upload.php">here</a></p>
  `;

  // Event listeners

  floatingMenu.style.display = 'block';
  document.body.appendChild(floatingMenu);

  document.getElementById('uploadButton').addEventListener('click', function () {
    if (!checkEmojiNameAvailability(document.getElementById('emoji_name').value)) {
      return ;
    }
    let x = parseInt(document.getElementById('widthInput').value);
    let y = parseInt(document.getElementById('heightInput').value);
    if (!document.getElementById('resizeCheckbox').checked) {
      x = -1;
      y = -1;
    }
    if (existingImage) {
      if (isCDNUrl(existingImage.src)) {
        if (document.getElementById('resizeCheckbox').checked) {
          uploadImageFromRemote(existingImage.src, x, y, document.getElementById('emoji_name').value);
        } else {
          let emoji_name = document.getElementById('emoji_name').value;
          emojis[emoji_name] = existingImage.src;
          // Save the updated data back to local storage
          localStorage.setItem('mam_emojis', JSON.stringify(emojis));
          emojiOrder.unshift(':' + emoji_name + ':');
          localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
          let result_p = document.getElementById('upload_status');
          result_p.innerText = '✅ Success';
          loadCustomEmojis();
        }
      } else {
        uploadImageFromRemote(existingImage.src, x, y, document.getElementById('emoji_name').value);
      }
    } else {
      uploadImage(document.getElementById('fileInput'), x, y, document.getElementById('emoji_name').value);
    }
  });

  if (!existingImage) {
    document.getElementById('fileInput').addEventListener('change', function() {
      const fileInput = document.getElementById('fileInput');
      const emojiNameInput = document.getElementById('emoji_name');

      if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        const strippedName = fileName.replace(/\.[^/.]+$/, ''); // Remove the file extension

        emojiNameInput.value = strippedName;
      }
    });
  }

  document.getElementById('resizeCheckbox').addEventListener('change', function () {
      // Enable/disable width and height inputs based on checkbox state
      let widthInput = document.getElementById('widthInput');
      let heightInput = document.getElementById('heightInput');
      widthInput.disabled = !this.checked;
      heightInput.disabled = !this.checked;
  });

  // Attach click event to the document to hide the menu when clicking outside
  document.addEventListener('click', function (event) {
      if (!event.target.matches('#emoji_add_button') && !event.target.matches('#floatingMenu') && !event.target.closest('#floatingMenu') && !event.target.matches('#emojiQuickAddButton')) {
          floatingMenu.remove();
      }
  });
}

function addPlusButton() {
    let plusButton = document.createElement('button');
    plusButton.id = 'emoji_add_button';
    plusButton.textContent = '➕';
    plusButton.style.marginTop = '2px';
    plusButton.style.marginRight = '2px';
    plusButton.style.paddingLeft = '1px';
    plusButton.style.paddingRight = '1px';
    plusButton.title = 'Add Emoji';

    plusButton.addEventListener('click', function () {
        let real_coords = getEffectiveCoords(plusButton);
        showUploadMenu(real_coords.x, real_coords.y);
    });

    let elem = document.getElementById('ui-id-2');
    if (elem) {
      elem.parentNode.after(plusButton);
    }
}

function resetEmojiOrder() {
  emojiOrder = [];
  localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
  loadCustomEmojis();
}

/* floating upload emoji menu */
function showSettingsMenu(x, y) {
  // Create the floating menu
  var floatingMenu = document.createElement('div');
  floatingMenu.id = 'floatingMenuSettings';
  floatingMenu.style.position = 'absolute';
  floatingMenu.style.top = y + 'px'; // Adjust the top position as needed
  floatingMenu.style.left = x + 'px'; // Adjust the right position as needed
  floatingMenu.style.backgroundColor = 'white';
  floatingMenu.style.border = '1px solid #ccc';
  floatingMenu.style.padding = '10px';
  floatingMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
  floatingMenu.style.display = 'block';

  floatingMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
      <h3 style='font-family: "Trebuchet MS",Verdana,Arial,Helvetica,sans-serif;'>Emoji Script Settings</h3>
      <button onclick="this.remove();" style="margin-left: auto;">❌</button>
      </div>

      <br>

      <label>
          <input type="checkbox" id="load_default"> Load default MaM emojis
      </label>
      <br>
      <label>
          Default resize width:
          <input type="number" id="default_width" value="${emojiSettings.default_width}">
      </label>
      <br>
      <label>
          Default resize height:
          <input type="number" id="default_height" value="${emojiSettings.default_height}">
      </label>
      <br>
      <button id="emoji_reset_order_button">Reset emoji order</button>
      <br>
      <br>
      <button id="exportButton">Export Settings</button>
      <br>
      <input type="file" id="importInput" accept=".json">
      <button id="importButton">Import Settings</button>
      <br>
      <p id="import_status"></p>

      <p>Note: you may need to reload the pages for some settings to apply</p>

  `;
  document.body.appendChild(floatingMenu);

  const loadDefaultCheckbox = document.getElementById('load_default');
  loadDefaultCheckbox.checked = emojiSettings.load_default;
  loadDefaultCheckbox.addEventListener('change', function() {
    emojiSettings.load_default = this.checked;
    localStorage.setItem('mam_emoji_settings', JSON.stringify(emojiSettings));
  });

  const default_widthInput = document.getElementById('default_width');
  default_widthInput.value = emojiSettings.default_width;
  default_widthInput.addEventListener('change', function() {
    emojiSettings.default_width = this.value;
    localStorage.setItem('mam_emoji_settings', JSON.stringify(emojiSettings));
  });

  const default_heightInput = document.getElementById('default_height');
  default_heightInput.value = emojiSettings.default_height;
  default_heightInput.addEventListener('change', function() {
    emojiSettings.default_height = this.value;
    localStorage.setItem('mam_emoji_settings', JSON.stringify(emojiSettings));
  });

  document.getElementById('emoji_reset_order_button').addEventListener('click', function() {resetEmojiOrder();});


  /* EXPORT/IMPORT */
  document.getElementById('exportButton').addEventListener('click', function() {
    if (!emojiSettings) {
      emojiSettings = {};
    }
    if (!emojis) {
      emojis = {};
    }

    // Create a combined object for export
    const exportData = {
      mam_emoji_settings: emojiSettings,
      mam_emojis: emojis,
      mam_emoji_order: emojiOrder,
      mam_emoji_disabled: emojiDisabled,
    };

    // Convert the combined object to a JSON string
    const exportString = JSON.stringify(exportData);

    // Create a Blob containing the export data
    const blob = new Blob([exportString], { type: 'application/json' });

    // Create a download link and trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `mam_emoji_export_${new Date().toISOString().split('.')[0].replace(/:/g, '-')}.json`;
    downloadLink.click();
  });

  document.getElementById('importButton').addEventListener('click', function() {
    const importInput = document.getElementById('importInput');

    // Ensure a file is selected
    if (!importInput.files || importInput.files.length === 0) {
      document.getElementById('import_status').innerText = '❌ Please select a JSON file to import';
      console.error('Error: Please select a JSON file to import.');
      return;
    }

    // Get the selected file
    const importedFile = importInput.files[0];

    // Create a FileReader to read the contents of the file
    const reader = new FileReader();

    reader.onload = function(event) {
      try {
        // Parse the JSON data
        const importedData = JSON.parse(event.target.result);

        // Check if the required objects are present in the imported data
        if (!importedData) {
          document.getElementById('import_status').innerText = '❌ Invalid JSON file or missing required objects';
          console.error('Error: Invalid JSON file or missing required objects.');
          return;
        }

        // Save the imported objects to local storage
        if ('mam_emoji_settings' in importedData) {
          localStorage.setItem('mam_emoji_settings', JSON.stringify(importedData.mam_emoji_settings));
        }
        if ('mam_emojis' in importedData) {
          localStorage.setItem('mam_emojis', JSON.stringify(importedData.mam_emojis));
        }
        if ('mam_emoji_order' in importedData) {
          localStorage.setItem('mam_emoji_order', JSON.stringify(importedData.mam_emoji_order));
        }
        if ('mam_emoji_disabled' in importedData) {
          localStorage.setItem('mam_emoji_disabled', JSON.stringify(importedData.mam_emoji_disabled));
        }
        loadDefaultSettings();

        document.getElementById('import_status').innerText = '✅ Import successful!';
        console.log('Import successful!');
      } catch (error) {
        document.getElementById('import_status').innerText = '❌ Unable to import, invalid JSON file';
        console.error('Error: Unable to import. Invalid JSON file.');
      }
    };

    // Read the contents of the file as text
    reader.readAsText(importedFile);
  });

  // Attach click event to the document to hide the menu when clicking outside
  document.addEventListener('click', function (event) {
      if (!event.target.matches('#settings_button') && !event.target.matches('#floatingMenuSettings') && !event.target.closest('#floatingMenuSettings')) {
          floatingMenu.remove();
      }
  });
}

/* Adds button showing the settings menu */
function addSettingsButton() {
    let plusButton = document.createElement('button');
    plusButton.id = 'settings_button';
    plusButton.textContent = '⚙️';
    plusButton.style.marginTop = '2px';
    plusButton.style.marginRight = '2px';
    plusButton.style.paddingLeft = '1px';
    plusButton.style.paddingRight = '1px';
    plusButton.title = 'Emoji Script Settings';
    plusButton.addEventListener('click', function () {
        let real_coords = getEffectiveCoords(plusButton);
        showSettingsMenu(real_coords.x, real_coords.y);
    });
    let elem = document.getElementById('ui-id-2');
    if (elem) {
      elem.parentNode.after(plusButton);
    }
}

/* Makes img show the delete confirmation dialog on click */
function deleteHandler() {
  let real_coords = getEffectiveCoords(this);
  showConfirmDelete(this.alt.replace(/:/g, ''), this.src, real_coords.x, real_coords.y);
}

/* Responsible for entering in emoji deletion mode */
function makeEmojisDeletable() {
  document.getElementById('trash_button').textContent = '❌';
  document.getElementById('trashspan').textContent = 'Click on an emoji to delete or disable it';
  var images = document.getElementById('dlsl').querySelectorAll('img[data-ssps]');
  images.forEach(function (img, index) {
    img.addEventListener('click', deleteHandler);
    img.removeEventListener('click', defaultImageClickHandler);
  });
}

/* Responsible for exiting the emoji deletion mode */
function makeEmojisUnDeletable() {
  document.getElementById('trash_button').textContent = '🚮';
  document.getElementById('trashspan').textContent = '';
  var images = document.getElementById('dlsl').querySelectorAll('img[data-ssps]');
  images.forEach(function (img, index) {
    img.addEventListener('click', defaultImageClickHandler);
    img.removeEventListener('click', deleteHandler);
  });
}

/* Responsible for entering in emoji deletion mode */
function makeEmojisRestoreable() {
  document.getElementById('restore_button').textContent = '❌';
  document.getElementById('trashspan').textContent = 'Click on an emoji to restore it';
  let selector = document.getElementById('dlsl');
  selector.innerHTML = '';
  emojiDisabled.forEach(function([name, url]) {
    var img = document.createElement('img');
    img.src = url;
    img.alt = name;
    img.title = name;
    //img.setAttribute('data-ssps', name);
    img.style.opacity = '0.4';
    img.addEventListener('mouseover', function() {
      img.style.opacity = '1.0'; // Set full opacity on mouseover
    });
    img.addEventListener('mouseout', function() {
        img.style.opacity = '0.4'; // Reset opacity on mouseout
    });
    img.addEventListener('click', function() {
      emojiDisabled = emojiDisabled.filter(item => item[0] !== name);
      localStorage.setItem('mam_emoji_disabled', JSON.stringify(emojiDisabled));
      emojiOrder.unshift(name);
      localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
      makeEmojisUnRestoreable();
    });
    selector.appendChild(img);
  });
}

/* Responsible for exiting the emoji deletion mode */
function makeEmojisUnRestoreable() {
  document.getElementById('restore_button').textContent = '♻️';
  document.getElementById('trashspan').textContent = '';
  loadCustomEmojis();
}

/* The menu that asks whether one really wishes to yeet an emote */
function showConfirmDelete(name, url, x, y) {
  let floatingMenu = document.createElement('div');
  floatingMenu.id = 'confirmDeleteMenu';
  floatingMenu.style.position = 'absolute';
  floatingMenu.style.top = y + 'px';
  floatingMenu.style.left = x + 'px';
  floatingMenu.style.backgroundColor = 'white';
  floatingMenu.style.border = '1px solid #ccc';
  floatingMenu.style.padding = '10px';
  floatingMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
  floatingMenu.style.display = 'block';

  /* Differentiating between stock and custom emojis */
  let src = emojis[name];
  if (!(name in emojis)) {
    src = url;
  }
  floatingMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
      <h3 style='font-family: "Trebuchet MS",Verdana,Arial,Helvetica,sans-serif;'>Do you really wish to delete ${name}?</h3>
      <button id="close" onclick="this.remove();" style="margin-left: auto;">❌</button>
      </div>

      <br>
      <img src="${src}" style="max-width: 40px;">
      <br>
      <div style="display: flex; justify-content: space-between;">
      <button id="del_nope" onclick="this.remove();">❌ NO</button>
      <button id="del_confirm" onclick="this.remove();" style="margin-left: auto;">✅ YES</button>
      </div>
  `;

  // Event listeners
  document.body.appendChild(floatingMenu);

  document.getElementById('close').addEventListener('click', function () {
      makeEmojisUnDeletable();
  });
  document.getElementById('del_confirm').addEventListener('click', function () {
      makeEmojisUnDeletable();
      if (!(name in emojis)) {
        /* we're dealing with a system emoji, so we only can disable it */
        emojiDisabled.push([':' + name + ':', src]);
        localStorage.setItem('mam_emoji_disabled', JSON.stringify(emojiDisabled));
      } else {
        delete emojis[name];
        localStorage.setItem('mam_emojis', JSON.stringify(emojis));
        emojiOrder = emojiOrder.filter(item => item !== name);
        localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
      }
      loadCustomEmojis();
  });
  document.getElementById('del_nope').addEventListener('click', function () {
      makeEmojisUnDeletable();
  });

  // Attach click event to the document to hide the menu when clicking outside
  document.addEventListener('click', function (event) {
      if (!event.target.matches('img[data-ssps]') && !event.target.matches('#trash_button') && !event.target.matches('#confirmDeleteMenu') && !event.target.closest('#confirmDeleteMenu')) {
          floatingMenu.remove();
        makeEmojisUnDeletable();
      }
  });
}

/* Adds a button that enables/disabels emoji deletion mode */
function addTrashcan() {
    let trashcanButton = document.createElement('button');
    trashcanButton.id = 'trash_button';
    trashcanButton.textContent = '🚮';
    trashcanButton.style.marginRight = '2px';
    trashcanButton.style.marginTop = '2px';
    trashcanButton.style.paddingLeft = '1px';
    trashcanButton.style.paddingRight = '1px';
    trashcanButton.title = 'Delete Emojis';
    trashcanButton.addEventListener('click', function () {
      if (document.getElementById('trash_button').textContent == '🚮') {
        makeEmojisDeletable();
      } else {
        makeEmojisUnDeletable();
      }
    });

    let elem = document.getElementById('ui-id-2');
    if (elem) {
      elem.parentNode.after(trashcanButton);
    }
}

/* Adds a button that enables/disabels emoji deletion mode */
function addRestore() {
    let restoreButton = document.createElement('button');
    restoreButton.id = 'restore_button';
    restoreButton.textContent = '♻️';
    restoreButton.style.marginRight = '2px';
    restoreButton.style.marginTop = '2px';
    restoreButton.style.paddingLeft = '1px';
    restoreButton.style.paddingRight = '1px';
    restoreButton.title = 'Delete Emojis';
    restoreButton.addEventListener('click', function () {
      if (document.getElementById('restore_button').textContent == '♻️') {
        makeEmojisRestoreable();
      } else {
        makeEmojisUnRestoreable();
      }
    });

    let elem = document.getElementById('ui-id-2');
    if (elem) {
      elem.parentNode.after(restoreButton);
    }
}

/* Adds a span to tell when the emoji delete mode is active */
function addTrashInfo() {
  let trashspan = document.createElement('span');
  trashspan.id = 'trashspan';
  trashspan.style.marginRight = '2px';
  trashspan.style.marginTop = '2px';
  trashspan.style.color = 'red';
  let elem = document.getElementById('ui-id-2');
  if (elem) {
    elem.parentNode.after(trashspan);
  }
}

/* Hijacking the function that loads original smileys */
if (typeof loadAndEnableSmileySelector !== 'function') {
  return ;
}
let loadAndEnableSmileySelector_old = loadAndEnableSmileySelector;

/* Populates the smiliesList with entries from the emojis localstorage variable */
/* Then, it adds stock emojis depending on the settings */
function loadCustomEmojis() {
  smiliesList = [];

  Object.entries(emojis).forEach(([key, url]) => {
      smiliesList.push({
          'label': key + ' <img src="' + url + '" alt="' + key + '" />',
          'url': url,
          'value': ":" + key + ":",
          'append': false
      });
  });
  if (emojiSettings.load_default) {
    loadDefaultEmojis();
  } else {
    smiliesLoad = setTimeout(doDisplayOfSmilies, 1);
  }
}

/* Loads stock emojis, copy pasted and adapted from site.js */
function loadDefaultEmojis() {
  fetch('/forums/json/load_smilies.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if ('failure' in data) {
                alertBox('Error', data.failure);
            } else {
                Object.entries(data).forEach(([key, url]) => {
                    smiliesList.push({
                        'label': key + ' <img src="' + cdn + '/pic/smilies/' + url + '" alt="' + key + '" />',
                        'url': url,
                        'value': key,
                        'append': false
                    });
                });

                smiliesLoad = setTimeout(doDisplayOfSmilies, 1);
            }
        })
        .catch(error => {
            ajaxErrorBox(error);
        });
}

/* MOST IMPORTANT THING, this adds buttons and then proceeds to first load custom emojis, and then MaM emojis if they are enabled */
loadAndEnableSmileySelector = function () {
  /* Adding elements in reverse order of appearance */
  addTrashInfo();
  addRestore();
  addTrashcan();
  addSettingsButton();
  addPlusButton();
  /* This function loads custom and original emojis as well */
  loadCustomEmojis();
};

/* This adds the emoji code to the shoutbox input when it is clicked */
function defaultImageClickHandler() {
  addTextToEditor(this.getAttribute('data-ssps'));
}

/* Hijacking the function that displays the loaded images */
/* It displays all emotes in the smiliesList global variable */
/* Besides displaying, it also adds various listeners to the images, such as add click or drag and drop to rearrange */
if (typeof doDisplayOfSmilies !== 'function') {
  return ;
}
doDisplayOfSmilies = function() {
  clearTimeout(smiliesLoad);
  /* The place where the emojis live */
  var selector = document.getElementById('dlsl');
  if (!selector) {
    return ;
  }
  /* The old place is replaced by a new empty one */
  var object = selector.cloneNode(true);
  object.innerHTML = '';

  /* Sorting emojis as per the emojiOrder localstorage variable */
  smiliesList.sort(function (a, b) {
    var indexA = emojiOrder.indexOf(a.value);
    var indexB = emojiOrder.indexOf(b.value);
    return indexA - indexB;
  });

  /* This loop appends all emojis as img tags to the new place */
  smiliesList.forEach(function(obj) {
    for (let i = 0; i < emojiDisabled.length; i ++) {
      if (emojiDisabled[i][0] == obj.value) {
        /* This acts as a continue in a foreach */
        return ;
      }
    }
    var img = document.createElement('img');
    /* Diferentiating between stock and custom emojis (stock ones don't use a full url in their url property) */
    if (obj.label.includes('/pic/smilies/') && !obj.url.includes('/pic/smilies/') /* if a user adds an official emote as custom emoji, it will have a full url already */) {
      img.src = cdn + '/pic/smilies/' + obj.url;
    } else {
      img.src = obj.url;
    }
    img.alt = obj.value;
    img.title = obj.value;
    img.setAttribute('data-ssps', obj.value);

    img.addEventListener('mouseover', function() {
      img.style.transform = 'scale(1.2)';
    });
    img.addEventListener('mouseout', function() {
        img.style.transform = 'scale(1.0)';
    });

    object.appendChild(img);

    /* If for some reason the emoji wasn't in the order variable, it is added at the end */
    if (!emojiOrder.includes(obj.value)) {
      emojiOrder.push(obj.value);
    }
  });

  /* Saving the order to localstorage in case any new entries were added */
  localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));

  /* Finalizing the selector replacement */
  selector.parentNode.replaceChild(object, selector);

  /* Drag and drop rearrangement, and click handlers */
  /* This loops over all added imgs and adds listeners to them */
  var images = object.querySelectorAll('img[data-ssps]');
  images.forEach(function (img, index) {
    /* The default handler which adds the emoji to the shoutbox textbox on click */
    img.addEventListener('click', defaultImageClickHandler);

    img.addEventListener('dragstart', function (event) {
      /* This adds the index of the dragged img to some sort of drag context variable which is then used to calculate where to place the dropped element */
      event.dataTransfer.setData('text/plain', img.alt);
      console.log(`Grabbed index ${index} (name ${img.alt})`);
      // Add opacity on drag
      img.style.opacity = '0.4';
      // Restore opacity after
      img.addEventListener('dragend', function () {
        img.style.opacity = '1';
      });

    });

    img.addEventListener('dragover', function (event) {
      event.preventDefault();
    });

    /* Whenever something is dragged over an img, it adds padding to its left, simulating a free slot on its left */
    img.addEventListener('dragenter', function (event) {
      event.preventDefault();
      img.style.opacity = '0.8';
      img.style.paddingLeft = '20px';
    });

    /* Restoring normal width when nothing is dragged over the img */
    img.addEventListener('dragleave', function (event) {
      event.preventDefault();
      img.style.paddingLeft = '0px';
      img.style.opacity = '1';
    });

    /* This displaces the dragged img */
    img.addEventListener('drop', function (event) {
      event.preventDefault();
      img.style.opacity = '1';
      img.style.paddingLeft = '0px';
      let toIndex = -1;
      for (let i = 0; i < smiliesList.length; i ++) {
        if (smiliesList[i].value == img.alt) {
          toIndex = i;
          break ;
        }
      }
      if (toIndex == -1) {
        return ;
      }
      let draggedIndex = -1;
      let val = event.dataTransfer.getData('text/plain');
      for (let i = 0; i < smiliesList.length; i ++) {
        if (smiliesList[i].value == val) {
          draggedIndex = i;
          break ;
        }
      }
      if (draggedIndex == -1) {
        return ;
      }
      console.log(img.alt);
      console.log(`dropped index ${draggedIndex} (${smiliesList[draggedIndex].value}) on index ${toIndex} (${smiliesList[toIndex].value})`);
      // Move the dragged image to the left of the drop position
      if (draggedIndex < toIndex) {
        toIndex--;
      }
      // Insert the dragged image at the new position
      let draggedSmiley = smiliesList.splice(draggedIndex, 1)[0];
      smiliesList.splice(toIndex, 0, draggedSmiley);
      // Update mam_emoji_order based on the new order
      emojiOrder = smiliesList.map(function (smiley) {
        return (smiley.value);
      });
      // Save the updated order to local storage
      localStorage.setItem('mam_emoji_order', JSON.stringify(emojiOrder));
      // Redraw the display
      doDisplayOfSmilies();
    });

  });

  /* Preventing default dragover and drop events for the entire emoji selector */
  let dropZone = object; // object is the new selector
  dropZone.addEventListener('dragover', function (event) {
    event.preventDefault();
  });
  dropZone.addEventListener('drop', function (event) {
    event.preventDefault();
  });
};
