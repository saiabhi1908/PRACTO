import Banner from '../components/Banner';
import Header from '../components/Header';
import SpecialityMenu from '../components/SpecialityMenu';
import TopDoctors from '../components/TopDoctors';
import LanguageRecommendation from '../components/LanguageRecommendation';

const Home = () => {
  return (
    <div>
      {/* Top Hero Section */}
      <Header />

      {/* ✅ Language Recommendation placed right below Header */}
      <LanguageRecommendation />

      {/* Specialities Grid (Find by Speciality) */}
      <SpecialityMenu />

      {/* Top Doctors Section */}
      <TopDoctors />

      {/* ✅ Admin Panel Box */}
      <div className="flex justify-center my-10">
        <a href="http://localhost:5174" target="_blank" rel="noopener noreferrer">
          <div className="w-full max-w-md p-6 transition-all bg-blue-100 border border-blue-300 shadow-md cursor-pointer rounded-xl hover:shadow-lg">
            <h2 className="mb-2 text-2xl font-bold text-blue-700">👨‍💼 Admin Panel</h2>
            <p className="text-gray-700">
              Click here to open the Admin Panel in a new window.
            </p>
          </div>
        </a>
      </div>

      {/* Banner with Trusted Doctors */}
      <Banner />
    </div>
  );
};

export default Home;
