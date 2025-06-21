import React, { useContext, useState } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const AddDoctor = () => {
  const [docImg, setDocImg] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('1 Year');
  const [fees, setFees] = useState('');
  const [about, setAbout] = useState('');
  const [speciality, setSpeciality] = useState('General physician');
  const [degree, setDegree] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [acceptedInsurances, setAcceptedInsurances] = useState([]);

  const { backendUrl } = useContext(AppContext);
  const { aToken } = useContext(AdminContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (!docImg) {
        return toast.error('Please upload a doctor image.');
      }

      const formData = new FormData();
      formData.append('image', docImg);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('experience', experience);
      formData.append('fees', Number(fees));
      formData.append('about', about);
      formData.append('speciality', speciality);
      formData.append('degree', degree);
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));
      formData.append('acceptedInsurances', JSON.stringify(acceptedInsurances));

      const url = backendUrl + '/api/admin/add-doctor';

      const { data } = await axios.post(
        url,
        formData,
        {
          headers: {
            Authorization: `Bearer ${aToken}`, // fixed syntax here
          },
        }
      );

      if (data.success) {
        toast.success(data.message);

        // Reset form fields
        setDocImg(null);
        setName('');
        setEmail('');
        setPassword('');
        setExperience('1 Year');
        setFees('');
        setAbout('');
        setSpeciality('General physician');
        setDegree('');
        setAddress1('');
        setAddress2('');
        setAcceptedInsurances([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response) {
        console.error('Response error:', error.response.data);
        toast.error(`Server error: ${error.response.data.message || error.response.statusText}`); // fixed string interpolation
      } else if (error.request) {
        console.error('No response:', error.request);
        toast.error('No response from server.');
      } else {
        console.error('Error:', error.message);
        toast.error('Error: ' + error.message);
      }
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Add Doctor</p>

      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="doc-img">
            <img
              className="w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer"
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt="Doctor"
            />
          </label>
          <input
            onChange={(e) => setDocImg(e.target.files[0])}
            type="file"
            id="doc-img"
            hidden
          />
          <p>Upload doctor<br />picture</p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          {/* Left column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p>Your Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Doctor name"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Doctor Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Set Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="border rounded px-3 py-2"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Experience</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="border rounded px-2 py-2"
              >
                {['1 Year','2 Year','3 Year','4 Year','5 Year','6 Year','8 Year','9 Year','10 Year'].map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p>Fees</p>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className="border rounded px-3 py-2"
                type="number"
                placeholder="Doctor fees"
                required
              />
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p>Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="border rounded px-2 py-2"
              >
                {[
                  'General physician',
                  'Gynecologist',
                  'Dermatologist',
                  'Pediatricians',
                  'Neurologist',
                  'Gastroenterologist',
                ].map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p>Degree</p>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Degree"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address Line 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address Line 2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Accepted Insurances</p>
              <select
                multiple
                value={acceptedInsurances}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                  setAcceptedInsurances(selectedOptions);
                }}
                className="border rounded px-3 py-2"
              >
                {[
                  'Aetna',
                  'Blue Cross',
                  'Cigna',
                  'United',
                  'Humana',
                  'UnitedHealthcare',
                  'Kaiser Permanente',
                  'Medicare',
                  'Medicaid',
                ].map((ins) => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
              <small className="text-gray-400">Hold Ctrl (Cmd on Mac) to select multiple options.</small>
            </div>

            <div className="flex flex-col gap-1">
              <p>About Doctor</p>
              <textarea
                onChange={(e) => setAbout(e.target.value)}
                value={about}
                className="border rounded px-3 py-2"
                placeholder="About the doctor"
                rows={5}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-8 py-2 rounded bg-primary hover:bg-primary/90 transition text-white mt-6"
        >
          Add Doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;
