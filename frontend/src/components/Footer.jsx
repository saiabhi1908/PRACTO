import { assets } from '../assets/assets';
import LanguageRecommendation from '../components/LanguageRecommendation';


const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10  mt-40 text-sm'>

        <div>
          <img className='w-40 mb-5' src={assets.practo} alt="" />
          

<p className='w-full my-5 leading-6 text-gray-600 md:w-2/3'>
  Practo is your trusted healthcare partner, making it easy to book 
  appointments with certified doctors, access medical reports, and connect 
  through secure online consultations. We are committed to providing 
  reliable, fast, and patient-friendly healthcare services, all in one place.
</p>

        </div>

        <div>
          <p className='mb-5 text-xl font-medium'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div>
          <p className='mb-5 text-xl font-medium'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+1-224-556-4775</li>
            <li>saiabhi@gmail.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2025 @ Prescripto.com - All Right Reserved.</p>
      </div>

    </div>
  )
}

export default Footer
